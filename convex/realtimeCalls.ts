// biome-ignore lint/style/useFilenamingConvention: Convex API references currently depend on this filename.
// @ts-nocheck

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

import { requireCurrentUser } from "./lib/auth";
import {
  closeSfuTracks,
  createSfuSession,
  generateTurnIceServers,
  publishLocalTracks,
  pullRemoteTracks,
  renegotiateSfuSession,
  type SessionDescription,
} from "./lib/cloudflare";
import { requireChannelAccess } from "./lib/permissions";

const HEARTBEAT_TIMEOUT_MS = 45_000;
const TURN_TTL_SECONDS = 60 * 60 * 4;

const buildRoomKey = (scopeType: "dm" | "voiceChannel", scopeId: string) =>
  scopeType === "dm" ? `dm:${scopeId}` : `voice:${scopeId}`;

const mergeUnique = (existing: string[], additions: string[]) => {
  return [...new Set([...existing, ...additions])];
};

export const listParticipants = query({
  args: {
    callRoomId: v.id("callRooms"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const room = await ctx.db.get(args.callRoomId);
    if (!room) {
      return [];
    }

    if (room.scopeType === "dm") {
      const conversation = await ctx.db.get(room.scopeId);
      if (!conversation?.participantIds.includes(user._id)) {
        throw new Error("Conversation not found.");
      }
    } else {
      await requireChannelAccess(ctx, room.scopeId, user._id);
    }

    const participants = await ctx.db
      .query("callRoomParticipants")
      .withIndex("by_callRoomId", (query) =>
        query.eq("callRoomId", args.callRoomId)
      )
      .collect();

    const freshParticipants = participants.filter(
      (participant) =>
        participant.status !== "leaving" &&
        Date.now() - participant.lastHeartbeatAt < HEARTBEAT_TIMEOUT_MS
    );

    return Promise.all(
      freshParticipants.map(async (participant) => ({
        ...participant,
        user: await ctx.db.get(participant.userId),
      }))
    );
  },
});

export const getIceServers = action({
  args: {},
  handler: async () => {
    const iceServers = await generateTurnIceServers(TURN_TTL_SECONDS);
    return { iceServers };
  },
});

export const touchCallSession = mutation({
  args: {
    callRoomId: v.id("callRooms"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const participant = await ctx.db
      .query("callRoomParticipants")
      .withIndex("by_user_callRoom", (query) =>
        query.eq("userId", user._id).eq("callRoomId", args.callRoomId)
      )
      .unique();

    if (!participant) {
      return null;
    }

    await ctx.db.patch(participant._id, {
      lastHeartbeatAt: Date.now(),
      status: "connected",
    });

    return await ctx.db.get(participant._id);
  },
});

export const subscribeToRemoteTracks = action({
  args: {
    callRoomId: v.id("callRooms"),
    sessionId: v.string(),
    remoteTracks: v.array(
      v.object({
        sessionId: v.string(),
        trackName: v.string(),
      })
    ),
    sessionDescription: v.optional(
      v.object({
        sdp: v.string(),
        type: v.union(v.literal("offer"), v.literal("answer")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining calls.");
    }

    const participant = await ctx.runQuery(
      internal.realtimeCalls.getParticipantForUser,
      {
        callRoomId: args.callRoomId,
        userId: current.user._id,
      }
    );
    if (!participant || participant.sessionId !== args.sessionId) {
      throw new Error("Call session not found.");
    }

    const uniqueTracks = args.remoteTracks.filter(
      (track, index, allTracks) =>
        track.sessionId !== args.sessionId &&
        allTracks.findIndex(
          (candidate) =>
            candidate.sessionId === track.sessionId &&
            candidate.trackName === track.trackName
        ) === index
    );

    if (uniqueTracks.length === 0) {
      return {
        requiresImmediateRenegotiation: false,
        sessionDescription: undefined,
        tracks: [],
      };
    }

    const response = await pullRemoteTracks({
      sessionId: args.sessionId,
      tracks: uniqueTracks.map((track) => ({
        location: "remote",
        sessionId: track.sessionId,
        trackName: track.trackName,
      })),
      sessionDescription: args.sessionDescription as
        | SessionDescription
        | undefined,
    });

    const subscriptionMids =
      response.tracks
        ?.map((track) => track.mid)
        .filter((mid): mid is string => Boolean(mid)) ?? [];

    await ctx.runMutation(
      internal.realtimeCalls.updateParticipantSubscriptions,
      {
        callRoomId: args.callRoomId,
        userId: current.user._id,
        subscriptionMids,
      }
    );

    return response;
  },
});

export const completeRenegotiation = action({
  args: {
    callRoomId: v.id("callRooms"),
    sessionId: v.string(),
    sessionDescription: v.object({
      sdp: v.string(),
      type: v.union(v.literal("offer"), v.literal("answer")),
    }),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining calls.");
    }

    const participant = await ctx.runQuery(
      internal.realtimeCalls.getParticipantForUser,
      {
        callRoomId: args.callRoomId,
        userId: current.user._id,
      }
    );
    if (!participant || participant.sessionId !== args.sessionId) {
      throw new Error("Call session not found.");
    }

    return renegotiateSfuSession({
      sessionId: args.sessionId,
      sessionDescription: args.sessionDescription as SessionDescription,
    });
  },
});

export const unsubscribeRemoteTracks = action({
  args: {
    callRoomId: v.id("callRooms"),
    sessionId: v.string(),
    mids: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining calls.");
    }

    const participant = await ctx.runQuery(
      internal.realtimeCalls.getParticipantForUser,
      {
        callRoomId: args.callRoomId,
        userId: current.user._id,
      }
    );
    if (!participant || participant.sessionId !== args.sessionId) {
      throw new Error("Call session not found.");
    }

    if (args.mids.length === 0) {
      return { tracks: [] };
    }

    const response = await closeSfuTracks({
      sessionId: args.sessionId,
      tracks: args.mids.map((mid) => ({ mid })),
      force: true,
    });

    await ctx.runMutation(
      internal.realtimeCalls.removeParticipantSubscriptions,
      {
        callRoomId: args.callRoomId,
        mids: args.mids,
        userId: current.user._id,
      }
    );

    return response;
  },
});

export const leaveCallSession = action({
  args: {
    callRoomId: v.id("callRooms"),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      return null;
    }

    const participant = await ctx.runQuery(
      internal.realtimeCalls.getParticipantForUser,
      {
        callRoomId: args.callRoomId,
        userId: current.user._id,
      }
    );
    if (!participant) {
      return null;
    }

    try {
      const mids = [
        ...(participant.publishedMid ? [participant.publishedMid] : []),
        ...participant.subscriptionMids,
      ];
      if (mids.length > 0) {
        await closeSfuTracks({
          sessionId: participant.sessionId,
          tracks: mids.map((mid) => ({ mid })),
          force: true,
        });
      }
    } catch {
      // Best-effort cleanup: participant state is removed even if Cloudflare has already closed the tracks.
    } finally {
      await ctx.runMutation(internal.realtimeCalls.removeParticipantForUser, {
        callRoomId: args.callRoomId,
        userId: current.user._id,
      });
    }

    return null;
  },
});

export const ensureCallRoom = internalMutation({
  args: {
    scopeType: v.union(v.literal("dm"), v.literal("voiceChannel")),
    scopeId: v.string(),
  },
  handler: async (ctx, args) => {
    const roomKey = buildRoomKey(args.scopeType, args.scopeId);
    const existing = await ctx.db
      .query("callRooms")
      .withIndex("by_scope", (query) =>
        query.eq("scopeType", args.scopeType).eq("scopeId", args.scopeId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        provider: "cloudflare-realtime-sfu",
        roomKey,
        status: "ready",
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("callRooms", {
      scopeType: args.scopeType,
      scopeId: args.scopeId,
      provider: "cloudflare-realtime-sfu",
      roomKey,
      status: "ready",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getParticipantForUser = internalQuery({
  args: {
    callRoomId: v.id("callRooms"),
    userId: v.id("users"),
  },
  handler: (ctx, args) => {
    return ctx.db
      .query("callRoomParticipants")
      .withIndex("by_user_callRoom", (query) =>
        query.eq("userId", args.userId).eq("callRoomId", args.callRoomId)
      )
      .unique();
  },
});

export const upsertParticipantForUser = internalMutation({
  args: {
    callRoomId: v.id("callRooms"),
    scopeType: v.union(v.literal("dm"), v.literal("voiceChannel")),
    scopeId: v.string(),
    userId: v.id("users"),
    sessionId: v.string(),
    audioTrackName: v.string(),
    publishedMid: v.optional(v.string()),
    status: v.union(
      v.literal("joining"),
      v.literal("connected"),
      v.literal("leaving")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("callRoomParticipants")
      .withIndex("by_user_callRoom", (query) =>
        query.eq("userId", args.userId).eq("callRoomId", args.callRoomId)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        sessionId: args.sessionId,
        audioTrackName: args.audioTrackName,
        publishedMid: args.publishedMid,
        status: args.status,
        lastHeartbeatAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("callRoomParticipants", {
      callRoomId: args.callRoomId,
      scopeType: args.scopeType,
      scopeId: args.scopeId,
      userId: args.userId,
      sessionId: args.sessionId,
      audioTrackName: args.audioTrackName,
      publishedMid: args.publishedMid,
      subscriptionMids: [],
      status: args.status,
      joinedAt: now,
      lastHeartbeatAt: now,
    });
  },
});

export const updateParticipantSubscriptions = internalMutation({
  args: {
    callRoomId: v.id("callRooms"),
    userId: v.id("users"),
    subscriptionMids: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("callRoomParticipants")
      .withIndex("by_user_callRoom", (query) =>
        query.eq("userId", args.userId).eq("callRoomId", args.callRoomId)
      )
      .unique();
    if (!participant) {
      return null;
    }

    await ctx.db.patch(participant._id, {
      lastHeartbeatAt: Date.now(),
      status: "connected",
      subscriptionMids: mergeUnique(
        participant.subscriptionMids,
        args.subscriptionMids
      ),
    });

    return participant._id;
  },
});

export const removeParticipantSubscriptions = internalMutation({
  args: {
    callRoomId: v.id("callRooms"),
    mids: v.array(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("callRoomParticipants")
      .withIndex("by_user_callRoom", (query) =>
        query.eq("userId", args.userId).eq("callRoomId", args.callRoomId)
      )
      .unique();
    if (!participant) {
      return null;
    }

    await ctx.db.patch(participant._id, {
      lastHeartbeatAt: Date.now(),
      subscriptionMids: participant.subscriptionMids.filter(
        (mid: string) => !args.mids.includes(mid)
      ),
    });

    return participant._id;
  },
});

export const removeParticipantForUser = internalMutation({
  args: {
    callRoomId: v.id("callRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("callRoomParticipants")
      .withIndex("by_user_callRoom", (query) =>
        query.eq("userId", args.userId).eq("callRoomId", args.callRoomId)
      )
      .unique();

    if (participant) {
      await ctx.db.delete(participant._id);
    }
  },
});

export const connectSessionForRoom = internalAction({
  args: {
    callRoomId: v.id("callRooms"),
    scopeType: v.union(v.literal("dm"), v.literal("voiceChannel")),
    scopeId: v.string(),
    userId: v.id("users"),
    localAudioMid: v.string(),
    localAudioTrackName: v.string(),
    offer: v.object({
      sdp: v.string(),
      type: v.union(v.literal("offer"), v.literal("answer")),
    }),
  },
  handler: async (ctx, args) => {
    const room = await ctx.runQuery(internal.realtimeCalls.getRoomById, {
      callRoomId: args.callRoomId,
    });
    if (!room) {
      throw new Error("Call room not found.");
    }

    const session = await createSfuSession({
      correlationId: `${args.scopeType}:${args.scopeId}:${args.userId}`,
    });
    const publishResponse = await publishLocalTracks({
      sessionDescription: args.offer as SessionDescription,
      sessionId: session.sessionId,
      tracks: [
        {
          location: "local",
          mid: args.localAudioMid,
          trackName: args.localAudioTrackName,
        },
      ],
    });

    const audioTrack = publishResponse.tracks?.find(
      (track) => !track.errorCode && track.trackName
    );
    if (!audioTrack?.trackName) {
      throw new Error("Cloudflare did not return an audio track.");
    }

    await ctx.runMutation(internal.realtimeCalls.upsertParticipantForUser, {
      callRoomId: args.callRoomId,
      scopeType: args.scopeType,
      scopeId: args.scopeId,
      userId: args.userId,
      sessionId: session.sessionId,
      audioTrackName: audioTrack.trackName ?? args.localAudioTrackName,
      publishedMid: audioTrack.mid ?? args.localAudioMid,
      status: "connected",
    });

    return {
      audioTrackName: audioTrack.trackName ?? args.localAudioTrackName,
      publishedMid: audioTrack.mid ?? args.localAudioMid,
      requiresImmediateRenegotiation:
        publishResponse.requiresImmediateRenegotiation ?? false,
      sessionDescription: publishResponse.sessionDescription,
      sessionId: session.sessionId,
    };
  },
});

export const getRoomById = internalQuery({
  args: {
    callRoomId: v.id("callRooms"),
  },
  handler: (ctx, args) => {
    return ctx.db.get(args.callRoomId);
  },
});
