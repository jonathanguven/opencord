const cloudflareRealtimeBaseUrl = "https://rtc.live.cloudflare.com/v1";

interface SessionDescription {
  sdp: string;
  type: "offer" | "answer";
}

interface IceServer {
  credential?: string;
  urls: string[];
  username?: string;
}

interface SfuTrackDescriptor {
  kind?: "audio" | "video";
  location: "local" | "remote";
  mid?: string;
  sessionId?: string;
  trackName?: string;
}

interface SfuTracksResponse {
  requiresImmediateRenegotiation?: boolean;
  sessionDescription?: SessionDescription;
  tracks?: Array<{
    sessionId?: string;
    trackName?: string;
    mid?: string;
    errorCode?: string;
    errorDescription?: string;
  }>;
}

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const sfuConfig = () => ({
  appId: requiredEnv("CLOUDFLARE_SFU_APP_ID"),
  apiToken: requiredEnv("CLOUDFLARE_SFU_API_TOKEN"),
});

const turnConfig = () => ({
  keyId: requiredEnv("CLOUDFLARE_TURN_KEY_ID"),
  apiToken: requiredEnv("CLOUDFLARE_TURN_API_TOKEN"),
});

const realtimeRequest = async <T>(
  path: string,
  apiToken: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${cloudflareRealtimeBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.errorDescription ??
      payload?.errors?.[0]?.message ??
      payload?.message ??
      response.statusText;
    throw new Error(
      `Cloudflare Realtime request failed for ${path}: ${response.status}${message ? ` (${message})` : ""}`
    );
  }

  if (payload?.errorCode) {
    throw new Error(
      payload.errorDescription ??
        `Cloudflare Realtime error: ${payload.errorCode}`
    );
  }

  return payload;
};

export const createSfuSession = (params?: {
  sessionDescription?: SessionDescription;
  correlationId?: string;
}) => {
  const { appId, apiToken } = sfuConfig();
  const query = params?.correlationId
    ? `?correlationId=${encodeURIComponent(params.correlationId)}`
    : "";
  const body = params?.sessionDescription
    ? JSON.stringify({ sessionDescription: params.sessionDescription })
    : undefined;

  return realtimeRequest<{
    sessionId: string;
    sessionDescription?: SessionDescription;
  }>(`/apps/${appId}/sessions/new${query}`, apiToken, {
    method: "POST",
    body,
  });
};

export const publishLocalTracks = (params: {
  sessionId: string;
  sessionDescription: SessionDescription;
  tracks: SfuTrackDescriptor[];
}) => {
  const { appId, apiToken } = sfuConfig();
  return realtimeRequest<SfuTracksResponse>(
    `/apps/${appId}/sessions/${params.sessionId}/tracks/new`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({
        sessionDescription: params.sessionDescription,
        tracks: params.tracks,
      }),
    }
  );
};

export const pullRemoteTracks = (params: {
  sessionId: string;
  tracks: SfuTrackDescriptor[];
  sessionDescription?: SessionDescription;
}) => {
  const { appId, apiToken } = sfuConfig();
  return realtimeRequest<SfuTracksResponse>(
    `/apps/${appId}/sessions/${params.sessionId}/tracks/new`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({
        tracks: params.tracks,
        ...(params.sessionDescription
          ? { sessionDescription: params.sessionDescription }
          : {}),
      }),
    }
  );
};

export const renegotiateSfuSession = (params: {
  sessionId: string;
  sessionDescription: SessionDescription;
}) => {
  const { appId, apiToken } = sfuConfig();
  return realtimeRequest<{ sessionDescription?: SessionDescription }>(
    `/apps/${appId}/sessions/${params.sessionId}/renegotiate`,
    apiToken,
    {
      method: "PUT",
      body: JSON.stringify({
        sessionDescription: params.sessionDescription,
      }),
    }
  );
};

export const closeSfuTracks = (params: {
  sessionId: string;
  tracks: Array<{ mid?: string }>;
  sessionDescription?: SessionDescription;
  force?: boolean;
}) => {
  const { appId, apiToken } = sfuConfig();
  return realtimeRequest<SfuTracksResponse>(
    `/apps/${appId}/sessions/${params.sessionId}/tracks/close`,
    apiToken,
    {
      method: "PUT",
      body: JSON.stringify({
        tracks: params.tracks,
        force: params.force ?? false,
        ...(params.sessionDescription
          ? { sessionDescription: params.sessionDescription }
          : {}),
      }),
    }
  );
};

export const getSessionState = (sessionId: string) => {
  const { appId, apiToken } = sfuConfig();
  return realtimeRequest<{
    tracks?: Array<{
      location?: "local" | "remote";
      mid?: string;
      trackName?: string;
      sessionId?: string;
    }>;
  }>(`/apps/${appId}/sessions/${sessionId}`, apiToken, {
    method: "GET",
  });
};

const isBrowserSafeTurnUrl = (url: string) => !url.includes(":53");

export const generateTurnIceServers = async (ttlSeconds: number) => {
  const { keyId, apiToken } = turnConfig();
  const payload = await realtimeRequest<{ iceServers?: IceServer[] }>(
    `/turn/keys/${keyId}/credentials/generate-ice-servers`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({ ttl: ttlSeconds }),
    }
  );

  const cloudflareStunServers: IceServer[] = [
    {
      urls: ["stun:stun.cloudflare.com:3478"],
    },
  ];

  const turnServers =
    payload.iceServers?.flatMap((server) => {
      const urls = server.urls.filter(isBrowserSafeTurnUrl);
      if (urls.length === 0) {
        return [];
      }

      return [
        {
          ...server,
          urls,
        },
      ];
    }) ?? [];

  return [...cloudflareStunServers, ...turnServers];
};

export type { IceServer, SessionDescription };
