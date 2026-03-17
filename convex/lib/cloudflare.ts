// @ts-nocheck
const cloudflareApiBase = "https://api.cloudflare.com/client/v4";

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const realtimeConfig = () => ({
  accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
  appId: requiredEnv("CLOUDFLARE_REALTIME_APP_ID"),
  apiToken: requiredEnv("CLOUDFLARE_REALTIME_TOKEN"),
  memberPreset: requiredEnv("CLOUDFLARE_REALTIME_MEMBER_PRESET"),
  moderatorPreset: requiredEnv("CLOUDFLARE_REALTIME_MODERATOR_PRESET"),
});

const realtimeRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const { apiToken } = realtimeConfig();
  const response = await fetch(`${cloudflareApiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Cloudflare Realtime request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.success === false) {
    throw new Error(payload.errors?.[0]?.message ?? "Cloudflare Realtime error");
  }

  return payload;
};

export const createRealtimeMeeting = async (title: string) => {
  const { accountId, appId } = realtimeConfig();
  const response = await realtimeRequest<{
    result: {
      id: string;
      title: string;
    };
  }>(`/accounts/${accountId}/realtime/kit/${appId}/meetings`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  return response.result;
};

export const addRealtimeParticipant = async (params: {
  meetingId: string;
  displayName: string;
  customParticipantId: string;
  moderator: boolean;
}) => {
  const { accountId, appId, memberPreset, moderatorPreset } = realtimeConfig();
  const response = await realtimeRequest<{
    result: {
      id: string;
      authToken: string;
      token?: string;
    };
  }>(`/accounts/${accountId}/realtime/kit/${appId}/meetings/${params.meetingId}/participants`, {
    method: "POST",
    body: JSON.stringify({
      name: params.displayName,
      preset_name: params.moderator ? moderatorPreset : memberPreset,
      custom_participant_id: params.customParticipantId,
    }),
  });

  return {
    participantId: response.result.id,
    authToken: response.result.authToken ?? response.result.token,
  };
};

export const refreshRealtimeParticipantToken = async (params: {
  meetingId: string;
  participantId: string;
}) => {
  const { accountId, appId } = realtimeConfig();
  const response = await realtimeRequest<{
    result?: {
      token: string;
    };
    data?: {
      token: string;
    };
  }>(
    `/accounts/${accountId}/realtime/kit/${appId}/meetings/${params.meetingId}/participants/${params.participantId}/token`,
    {
      method: "POST",
    },
  );

  return response.result?.token ?? response.data?.token;
};
