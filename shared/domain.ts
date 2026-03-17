export const CHANNEL_KINDS = ["text", "voice"] as const;
export const CHANNEL_ACCESS = ["public", "private"] as const;
export const THREAD_TYPES = ["dm", "channel"] as const;
export const ROOM_SCOPE_TYPES = ["dm", "voiceChannel"] as const;

export type ChannelKind = (typeof CHANNEL_KINDS)[number];
export type ChannelAccess = (typeof CHANNEL_ACCESS)[number];
export type ThreadType = (typeof THREAD_TYPES)[number];
export type RoomScopeType = (typeof ROOM_SCOPE_TYPES)[number];

export const PERMISSIONS = [
  "manageChannels",
  "createInvites",
  "moveMembers",
  "muteMembers",
  "deafenMembers",
  "manageRoles",
  "admin",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type PermissionSet = Record<Permission, boolean>;

export const defaultPermissionSet = (): PermissionSet => ({
  manageChannels: false,
  createInvites: false,
  moveMembers: false,
  muteMembers: false,
  deafenMembers: false,
  manageRoles: false,
  admin: false,
});

export type AppUser = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: number;
};

export type ServerRole = {
  id: string;
  serverId: string;
  name: string;
  position: number;
  permissions: PermissionSet;
};

export type Channel = {
  id: string;
  serverId: string;
  kind: ChannelKind;
  name: string;
  order: number;
  access: ChannelAccess;
};

export type Conversation = {
  id: string;
  kind: "dm";
  participantIds: string[];
};

export type Message = {
  id: string;
  threadType: ThreadType;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: number;
  editedAt?: number;
};

export type VoiceState = {
  userId: string;
  serverId: string;
  channelId: string;
  muted: boolean;
  deafened: boolean;
  connectedAt: number;
  lastHeartbeatAt: number;
};

export type CallRoom = {
  scopeType: RoomScopeType;
  scopeId: string;
  provider: "cloudflare-realtimekit";
  meetingId: string;
  status: "ready" | "failed";
};
