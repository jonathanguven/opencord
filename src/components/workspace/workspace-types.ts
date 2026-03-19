import type { Doc, Id } from "../../../convex/_generated/dataModel";

export interface ServerListItem extends Doc<"serverMembers"> {
  server: Doc<"servers"> | null;
}

export interface FriendLite {
  _id: Id<"users">;
  avatarUrl?: string | null;
  displayName?: string | null;
  handle?: string | null;
}

export interface FriendsResult {
  friends: FriendLite[];
  incoming: Array<Doc<"friendRequests"> & { fromUser: Doc<"users"> | null }>;
  outgoing: Array<Doc<"friendRequests"> & { toUser: Doc<"users"> | null }>;
}

export interface MessageListItem extends Doc<"messages"> {
  author: Doc<"users"> | null;
  imageUrl?: string | null;
}

export interface PendingMessageImage {
  fileName: string;
  isUploading: boolean;
  previewUrl: string;
}

export interface ConversationListItem extends Doc<"conversations"> {
  activeCall: Doc<"dmCallSessions"> | null;
  latestMessage: Doc<"messages"> | null;
  otherUser: Doc<"users"> | null;
}

export interface VoicePresenceItem extends Doc<"activeVoiceStates"> {
  user: Doc<"users"> | null;
}

export interface WorkspaceResult {
  channels: Doc<"channels">[];
  members: Array<Doc<"serverMembers"> & { user: Doc<"users"> | null }>;
  membership: Doc<"serverMembers">;
  roles: Doc<"roles">[];
  server: Doc<"servers"> | null;
  voiceStates: Doc<"activeVoiceStates">[];
}

export type ActiveCall =
  | {
      callRoomId: Id<"callRooms">;
      channelId: Id<"channels">;
      deafened: boolean;
      iceServers: Array<{
        credential?: string;
        urls: string[];
        username?: string;
      }>;
      kind: "voice";
      label: string;
      muted: boolean;
      roomKey: string;
      serverId: Id<"servers">;
      sessionId?: string;
    }
  | {
      callRoomId: Id<"callRooms">;
      conversationId: Id<"conversations">;
      deafened: boolean;
      iceServers: Array<{
        credential?: string;
        urls: string[];
        username?: string;
      }>;
      kind: "dm";
      label: string;
      muted: boolean;
      roomKey: string;
      sessionId?: string;
    };
