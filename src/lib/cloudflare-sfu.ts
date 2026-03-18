export interface SessionDescription {
  sdp: string;
  type: "offer" | "answer";
}

export interface IceServerConfig {
  credential?: string;
  urls: string[];
  username?: string;
}

export const createCloudflarePeerConnection = (
  iceServers: IceServerConfig[],
  onTrack: (event: RTCTrackEvent) => void
) => {
  const peerConnection = new RTCPeerConnection({
    iceServers,
  });

  peerConnection.addEventListener("track", onTrack);
  return peerConnection;
};

export const createRemoteAudioElement = (stream: MediaStream) => {
  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;
  audioElement.setAttribute("playsinline", "true");
  audioElement.srcObject = stream;
  audioElement.play().catch(() => undefined);
  return audioElement;
};

export const removeAudioElement = (
  audioElement: HTMLAudioElement | undefined
) => {
  if (!audioElement) {
    return;
  }

  audioElement.pause();
  audioElement.srcObject = null;
};

export const setAudioElementsMuted = (
  elements: Iterable<HTMLAudioElement>,
  muted: boolean
) => {
  for (const element of elements) {
    element.muted = muted;
  }
};
