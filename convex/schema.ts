import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const permissionSet = v.object({
  manageChannels: v.boolean(),
  createInvites: v.boolean(),
  moveMembers: v.boolean(),
  muteMembers: v.boolean(),
  deafenMembers: v.boolean(),
  manageRoles: v.boolean(),
  admin: v.boolean(),
});

export default defineSchema({
  ...authTables,

  users: defineTable({
    ...authTables.users.validator.fields,
    handle: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_handle", ["handle"]),

  friendRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    createdAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("cancelled")
    ),
  })
    .index("by_pair", ["fromUserId", "toUserId"])
    .index("by_toUserId", ["toUserId"])
    .index("by_fromUserId", ["fromUserId"]),

  friendships: defineTable({
    userAId: v.id("users"),
    userBId: v.id("users"),
    pairKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_pairKey", ["pairKey"])
    .index("by_userAId", ["userAId"])
    .index("by_userBId", ["userBId"]),

  servers: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  serverMembers: defineTable({
    serverId: v.id("servers"),
    userId: v.id("users"),
    nickname: v.optional(v.string()),
    roleIds: v.array(v.id("roles")),
    isOwner: v.boolean(),
    joinedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_server_user", ["serverId", "userId"])
    .index("by_userId", ["userId"])
    .index("by_serverId", ["serverId"]),

  roles: defineTable({
    serverId: v.id("servers"),
    name: v.string(),
    position: v.number(),
    color: v.optional(v.string()),
    permissions: permissionSet,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_serverId", ["serverId"])
    .index("by_server_position", ["serverId", "position"]),

  channels: defineTable({
    serverId: v.id("servers"),
    name: v.string(),
    kind: v.union(v.literal("text"), v.literal("voice")),
    access: v.union(v.literal("public"), v.literal("private")),
    order: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_serverId", ["serverId"])
    .index("by_server_order", ["serverId", "order"]),

  channelAccessRules: defineTable({
    channelId: v.id("channels"),
    roleId: v.optional(v.id("roles")),
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_channelId", ["channelId"])
    .index("by_channel_role", ["channelId", "roleId"])
    .index("by_channel_user", ["channelId", "userId"]),

  invites: defineTable({
    serverId: v.id("servers"),
    code: v.string(),
    createdBy: v.id("users"),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    useCount: v.number(),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_serverId", ["serverId"]),

  conversations: defineTable({
    kind: v.literal("dm"),
    participantIds: v.array(v.id("users")),
    participantAId: v.id("users"),
    participantBId: v.id("users"),
    pairKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pairKey", ["pairKey"])
    .index("by_participantAId", ["participantAId"])
    .index("by_participantBId", ["participantBId"])
    .index("by_updatedAt", ["updatedAt"]),

  messages: defineTable({
    threadType: v.union(v.literal("dm"), v.literal("channel")),
    threadId: v.string(),
    authorId: v.id("users"),
    body: v.string(),
    imageContentType: v.optional(v.string()),
    imageKey: v.optional(v.string()),
    imageSize: v.optional(v.number()),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
  }).index("by_thread", ["threadType", "threadId", "createdAt"]),

  messageUploads: defineTable({
    authorId: v.id("users"),
    createdAt: v.number(),
    key: v.string(),
    messageId: v.optional(v.id("messages")),
    usedAt: v.optional(v.number()),
  })
    .index("by_authorId", ["authorId"])
    .index("by_key", ["key"]),

  activeVoiceStates: defineTable({
    userId: v.id("users"),
    serverId: v.id("servers"),
    channelId: v.id("channels"),
    desiredChannelId: v.optional(v.id("channels")),
    muted: v.boolean(),
    deafened: v.boolean(),
    forcedMute: v.boolean(),
    forcedDeafen: v.boolean(),
    connectedAt: v.number(),
    lastHeartbeatAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_server_channel", ["serverId", "channelId"])
    .index("by_serverId", ["serverId"]),

  callRooms: defineTable({
    scopeType: v.union(v.literal("dm"), v.literal("voiceChannel")),
    scopeId: v.string(),
    provider: v.union(
      v.literal("cloudflare-realtime-sfu"),
      v.literal("cloudflare-realtimekit")
    ),
    roomKey: v.optional(v.string()),
    meetingId: v.optional(v.string()),
    status: v.union(v.literal("ready"), v.literal("failed")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_scope", ["scopeType", "scopeId"]),

  callRoomParticipants: defineTable({
    callRoomId: v.id("callRooms"),
    scopeType: v.union(v.literal("dm"), v.literal("voiceChannel")),
    scopeId: v.string(),
    userId: v.id("users"),
    sessionId: v.string(),
    audioTrackName: v.string(),
    publishedMid: v.optional(v.string()),
    subscriptionMids: v.array(v.string()),
    status: v.union(
      v.literal("joining"),
      v.literal("connected"),
      v.literal("leaving")
    ),
    joinedAt: v.number(),
    lastHeartbeatAt: v.number(),
  })
    .index("by_callRoomId", ["callRoomId"])
    .index("by_scope", ["scopeType", "scopeId"])
    .index("by_user_callRoom", ["userId", "callRoomId"])
    .index("by_sessionId", ["sessionId"]),

  dmCallSessions: defineTable({
    conversationId: v.id("conversations"),
    startedBy: v.id("users"),
    status: v.union(
      v.literal("ringing"),
      v.literal("active"),
      v.literal("ended")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_status", ["status"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    eventType: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
