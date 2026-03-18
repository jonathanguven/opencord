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

export interface AppUser {
  avatarUrl?: string;
  createdAt: number;
  displayName: string;
  handle: string;
  id: string;
}

export interface ServerRole {
  id: string;
  name: string;
  permissions: PermissionSet;
  position: number;
  serverId: string;
}

export interface Channel {
  access: ChannelAccess;
  id: string;
  kind: ChannelKind;
  name: string;
  order: number;
  serverId: string;
}

export interface Conversation {
  id: string;
  kind: "dm";
  participantIds: string[];
}

export interface Message {
  authorId: string;
  body: string;
  createdAt: number;
  editedAt?: number;
  id: string;
  threadId: string;
  threadType: ThreadType;
}

export interface VoiceState {
  channelId: string;
  connectedAt: number;
  deafened: boolean;
  lastHeartbeatAt: number;
  muted: boolean;
  serverId: string;
  userId: string;
}

export interface CallRoom {
  provider: "cloudflare-realtime-sfu";
  roomKey: string;
  scopeId: string;
  scopeType: RoomScopeType;
  status: "ready" | "failed";
}
