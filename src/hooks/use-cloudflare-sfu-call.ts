import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  createCloudflarePeerConnection,
  createRemoteAudioElement,
  type IceServerConfig,
  removeAudioElement,
  type SessionDescription,
  setAudioElementsMuted,
} from "@/lib/cloudflare-sfu";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface PreparedCallBase {
  callRoomId: Id<"callRooms">;
  deafened: boolean;
  iceServers: IceServerConfig[];
  kind: "dm" | "voice";
  label: string;
  muted: boolean;
  roomKey: string;
  sessionId?: string;
}

type PreparedDmCall = PreparedCallBase & {
  conversationId: Id<"conversations">;
  kind: "dm";
};

type PreparedVoiceCall = PreparedCallBase & {
  channelId: Id<"channels">;
  kind: "voice";
  serverId: Id<"servers">;
};

export type PreparedCall = PreparedDmCall | PreparedVoiceCall;

type ConnectedVoiceState = Doc<"activeVoiceStates"> | null | undefined;

interface UseCloudflareSfuCallParams {
  activeCall: PreparedCall | null;
  currentUserId?: Id<"users">;
  onCallChange: (
    updater: (call: PreparedCall | null) => PreparedCall | null
  ) => void;
  onMoveToChannel: (channelId: Id<"channels">) => void;
}

interface SubscribeTrack {
  sessionId: string;
  trackName: string;
}

const trackKey = (track: SubscribeTrack) =>
  `${track.sessionId}:${track.trackName}`;

const ignorePromise = (promise: Promise<unknown>) => {
  promise.catch(() => undefined);
};

export const useCloudflareSfuCall = ({
  activeCall,
  currentUserId,
  onCallChange,
  onMoveToChannel,
}: UseCloudflareSfuCallParams) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const connectDmCallSession = useAction(api.calls.connectDmCallSession);
  const connectVoiceSession = useAction(api.voice.connectVoiceSession);
  const subscribeToRemoteTracks = useAction(
    api.realtimeCalls.subscribeToRemoteTracks
  );
  const completeRenegotiation = useAction(
    api.realtimeCalls.completeRenegotiation
  );
  const unsubscribeRemoteTracks = useAction(
    api.realtimeCalls.unsubscribeRemoteTracks
  );
  const leaveCallSession = useAction(api.realtimeCalls.leaveCallSession);
  const touchCallSession = useMutation(api.realtimeCalls.touchCallSession);
  const selfVoiceState = useQuery(
    api.voice.getSelfState,
    activeCall?.kind === "voice" ? {} : "skip"
  ) as ConnectedVoiceState;
  const participants = useQuery(
    api.realtimeCalls.listParticipants,
    activeCall ? { callRoomId: activeCall.callRoomId } : "skip"
  ) as
    | Array<
        Doc<"callRoomParticipants"> & {
          user: Doc<"users"> | null;
        }
      >
    | undefined;

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef(new Map<string, HTMLAudioElement>());
  const subscribedTracksRef = useRef(new Map<string, string>());
  const pendingTrackSubscriptionsRef = useRef(new Set<string>());
  const negotiationRef = useRef(Promise.resolve());
  const connectAttemptRef = useRef(0);
  const isConnectingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const destroyMedia = useEffectEvent(async (skipBackendLeave: boolean) => {
    const callAtCleanup = activeCall;
    const sessionId = sessionIdRef.current;
    connectAttemptRef.current += 1;

    setIsConnecting(false);
    isConnectingRef.current = false;
    sessionIdRef.current = null;

    if (!skipBackendLeave && callAtCleanup) {
      try {
        await leaveCallSession({ callRoomId: callAtCleanup.callRoomId });
      } catch {
        // Ignore duplicate/disconnected cleanup failures.
      }
    }

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localTrackRef.current?.stop();
    localTrackRef.current = null;

    for (const track of localStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    localStreamRef.current = null;

    for (const audioElement of remoteAudioRef.current.values()) {
      removeAudioElement(audioElement);
    }
    remoteAudioRef.current.clear();
    pendingTrackSubscriptionsRef.current.clear();
    subscribedTracksRef.current.clear();

    if (sessionId && callAtCleanup) {
      onCallChange((currentCall) => {
        if (
          !currentCall ||
          currentCall.callRoomId !== callAtCleanup.callRoomId
        ) {
          return currentCall;
        }

        return {
          ...currentCall,
          sessionId: undefined,
        };
      });
    }
  });

  const applyRemoteNegotiation = useEffectEvent(
    async (
      callRoomId: Id<"callRooms">,
      sessionId: string,
      remoteDescription?: SessionDescription
    ) => {
      const peerConnection = peerConnectionRef.current;
      if (!(peerConnection && remoteDescription)) {
        return;
      }

      if (sessionIdRef.current !== sessionId) {
        return;
      }

      if (remoteDescription.type === "answer") {
        if (peerConnection.signalingState !== "have-local-offer") {
          return;
        }
      } else if (peerConnection.signalingState !== "stable") {
        return;
      }

      await peerConnection.setRemoteDescription(remoteDescription);

      if (remoteDescription.type === "offer") {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await completeRenegotiation({
          callRoomId,
          sessionDescription: {
            sdp: answer.sdp ?? "",
            type: answer.type as "answer",
          },
          sessionId,
        });
      }
    }
  );

  const queueNegotiation = useEffectEvent(async (work: () => Promise<void>) => {
    negotiationRef.current = negotiationRef.current
      .catch(() => undefined)
      .then(work);
    await negotiationRef.current;
  });

  const connectCallSession = useEffectEvent(
    async (
      call: PreparedCall,
      localAudioMid: string,
      localAudioTrackName: string,
      offer: RTCSessionDescriptionInit
    ) =>
      call.kind === "voice"
        ? connectVoiceSession({
            callRoomId: call.callRoomId,
            channelId: call.channelId,
            localAudioMid,
            localAudioTrackName,
            offer: {
              sdp: offer.sdp ?? "",
              type: offer.type as "offer",
            },
          })
        : connectDmCallSession({
            callRoomId: call.callRoomId,
            conversationId: call.conversationId,
            localAudioMid,
            localAudioTrackName,
            offer: {
              sdp: offer.sdp ?? "",
              type: offer.type as "offer",
            },
          })
  );

  const syncCallSession = useEffectEvent(
    (callRoomId: Id<"callRooms">, sessionId: string) => {
      onCallChange((currentCall) => {
        if (!currentCall || currentCall.callRoomId !== callRoomId) {
          return currentCall;
        }

        return {
          ...currentCall,
          sessionId,
        };
      });
    }
  );

  const ensureConnected = useEffectEvent(async (call: PreparedCall) => {
    if (peerConnectionRef.current || isConnectingRef.current) {
      return;
    }

    const attemptId = connectAttemptRef.current + 1;
    connectAttemptRef.current = attemptId;
    isConnectingRef.current = true;
    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const [localTrack] = stream.getAudioTracks();
      if (!localTrack) {
        throw new Error("No microphone track available.");
      }

      const peerConnection = createCloudflarePeerConnection(
        call.iceServers,
        (event) => {
          const remoteStream =
            event.streams[0] ?? new MediaStream([event.track]);
          const audioElement = createRemoteAudioElement(remoteStream);
          audioElement.muted =
            call.deafened ||
            Boolean(selfVoiceState?.deafened || selfVoiceState?.forcedDeafen);
          remoteAudioRef.current.set(event.track.id, audioElement);
          event.track.addEventListener("ended", () => {
            removeAudioElement(remoteAudioRef.current.get(event.track.id));
            remoteAudioRef.current.delete(event.track.id);
          });
        }
      );

      peerConnectionRef.current = peerConnection;
      localStreamRef.current = stream;
      localTrackRef.current = localTrack;

      peerConnection.addTrack(localTrack, stream);
      localTrack.enabled = !(
        call.muted ||
        (call.kind === "voice" &&
          Boolean(selfVoiceState?.forcedMute || selfVoiceState?.deafened))
      );

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      const audioTransceiver = peerConnection
        .getTransceivers()
        .find((transceiver) => transceiver.sender.track?.id === localTrack.id);
      const localAudioMid = audioTransceiver?.mid;
      if (!localAudioMid) {
        throw new Error("Unable to determine the local audio transceiver.");
      }

      const connectionResponse = await connectCallSession(
        call,
        localAudioMid,
        localTrack.id,
        offer
      );

      if (
        connectAttemptRef.current !== attemptId ||
        peerConnectionRef.current !== peerConnection
      ) {
        return;
      }

      sessionIdRef.current = connectionResponse.sessionId;

      syncCallSession(call.callRoomId, connectionResponse.sessionId);

      await applyRemoteNegotiation(
        call.callRoomId,
        connectionResponse.sessionId,
        connectionResponse.sessionDescription
      );
    } catch (error) {
      await destroyMedia(false);
      throw error;
    } finally {
      if (connectAttemptRef.current === attemptId) {
        isConnectingRef.current = false;
      }
      setIsConnecting(false);
    }
  });

  useEffect(() => {
    if (!activeCall) {
      ignorePromise(destroyMedia(true));
      return;
    }

    if (!activeCall.sessionId) {
      ignorePromise(ensureConnected(activeCall));
    }
  }, [activeCall]);

  useEffect(() => {
    if (!activeCall) {
      return;
    }

    const intervalId = window.setInterval(() => {
      ignorePromise(touchCallSession({ callRoomId: activeCall.callRoomId }));
    }, 25_000);

    return () => window.clearInterval(intervalId);
  }, [activeCall, touchCallSession]);

  const remotePublishedTracks =
    participants && currentUserId
      ? participants
          .filter(
            (participant) =>
              participant.userId !== currentUserId &&
              participant.audioTrackName.length > 0
          )
          .map((participant) => ({
            sessionId: participant.sessionId,
            trackName: participant.audioTrackName,
          }))
      : [];

  useEffect(() => {
    if (!(activeCall?.sessionId && participants)) {
      return;
    }

    const sessionId = activeCall.sessionId;

    ignorePromise(
      queueNegotiation(async () => {
        const missingTracks = remotePublishedTracks.filter((track) => {
          const key = trackKey(track);
          return !(
            subscribedTracksRef.current.has(key) ||
            pendingTrackSubscriptionsRef.current.has(key)
          );
        });
        if (missingTracks.length === 0) {
          return;
        }

        for (const track of missingTracks) {
          pendingTrackSubscriptionsRef.current.add(trackKey(track));
        }

        try {
          const response = await subscribeToRemoteTracks({
            callRoomId: activeCall.callRoomId,
            remoteTracks: missingTracks,
            sessionId: activeCall.sessionId,
          });

          for (const track of response.tracks ?? []) {
            if (!(track.sessionId && track.trackName && track.mid)) {
              continue;
            }

            subscribedTracksRef.current.set(
              trackKey({
                sessionId: track.sessionId,
                trackName: track.trackName,
              }),
              track.mid
            );
          }

          await applyRemoteNegotiation(
            activeCall.callRoomId,
            sessionId,
            response.sessionDescription
          );
        } finally {
          for (const track of missingTracks) {
            pendingTrackSubscriptionsRef.current.delete(trackKey(track));
          }
        }
      })
    );
  }, [
    activeCall,
    participants,
    remotePublishedTracks,
    subscribeToRemoteTracks,
  ]);

  useEffect(() => {
    if (!activeCall?.sessionId) {
      return;
    }

    const activeTrackKeys = new Set(remotePublishedTracks.map(trackKey));
    const removedEntries = [...subscribedTracksRef.current.entries()].filter(
      ([key]) => !activeTrackKeys.has(key)
    );
    if (removedEntries.length === 0) {
      return;
    }

    const mids = removedEntries.map(([, mid]) => mid);
    for (const [key] of removedEntries) {
      pendingTrackSubscriptionsRef.current.delete(key);
      subscribedTracksRef.current.delete(key);
    }

    ignorePromise(
      unsubscribeRemoteTracks({
        callRoomId: activeCall.callRoomId,
        mids,
        sessionId: activeCall.sessionId,
      })
    );
  }, [activeCall, remotePublishedTracks, unsubscribeRemoteTracks]);

  useEffect(() => {
    const shouldMuteRemoteAudio =
      Boolean(activeCall?.deafened) ||
      Boolean(selfVoiceState?.deafened) ||
      Boolean(selfVoiceState?.forcedDeafen);
    setAudioElementsMuted(
      remoteAudioRef.current.values(),
      shouldMuteRemoteAudio
    );
  }, [
    activeCall?.deafened,
    selfVoiceState?.deafened,
    selfVoiceState?.forcedDeafen,
  ]);

  useEffect(() => {
    if (!localTrackRef.current) {
      return;
    }

    const muted =
      Boolean(activeCall?.muted) ||
      Boolean(selfVoiceState?.deafened) ||
      Boolean(selfVoiceState?.forcedMute);
    localTrackRef.current.enabled = !muted;
  }, [activeCall?.muted, selfVoiceState?.deafened, selfVoiceState?.forcedMute]);

  useEffect(() => {
    if (!activeCall || activeCall.kind !== "voice" || !selfVoiceState) {
      return;
    }

    if (selfVoiceState.forcedMute) {
      onCallChange((currentCall) => {
        if (!currentCall || currentCall.callRoomId !== activeCall.callRoomId) {
          return currentCall;
        }
        return {
          ...currentCall,
          muted: true,
        };
      });
    }

    if (selfVoiceState.forcedDeafen) {
      onCallChange((currentCall) => {
        if (!currentCall || currentCall.callRoomId !== activeCall.callRoomId) {
          return currentCall;
        }
        return {
          ...currentCall,
          deafened: true,
          muted: true,
        };
      });
    }

    const targetChannelId = selfVoiceState.desiredChannelId;
    if (targetChannelId && targetChannelId !== activeCall.channelId) {
      ignorePromise(
        destroyMedia(false).then(() => {
          onMoveToChannel(targetChannelId);
        })
      );
    }
  }, [activeCall, onCallChange, onMoveToChannel, selfVoiceState]);

  useEffect(() => {
    return () => {
      ignorePromise(destroyMedia(false));
    };
  }, []);

  const leave = useEffectEvent(async () => {
    await destroyMedia(false);
  });

  return {
    isConnecting,
    leave,
    selfVoiceState,
  };
};
