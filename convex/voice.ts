// @ts-nocheck

import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";

import { requireCurrentUser } from "./lib/auth";
import { generateTurnIceServers } from "./lib/cloudflare";
import {
  canAccessChannel,
  requireChannelAccess,
  requirePermission,
  requireServerMember,
  resolveServerPermissions,
} from "./lib/permissions";

const HEARTBEAT_TIMEOUT_MS = 45_000;
const TURN_TTL_SECONDS = 60 * 60 * 4;

const resolveRoomKey = (room: { roomKey?: string; scopeId: string }) =>
  room.roomKey ?? `voice:${room.scopeId}`;

export const listForServer = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requireServerMember(ctx, args.serverId, user._id);

    const voiceStates = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_serverId", (query) => query.eq("serverId", args.serverId))
      .collect();

    const fresh = voiceStates.filter(
      (state) => Date.now() - state.lastHeartbeatAt < HEARTBEAT_TIMEOUT_MS
    );

    return Promise.all(
      fresh.map(async (state) => ({
        ...state,
        user: await ctx.db.get(state.userId),
      }))
    );
  },
});

export const getSelfState = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireCurrentUser(ctx);
    return ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .unique();
  },
});

export const getVoiceJoinContext = query({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const { channel, member } = await requireChannelAccess(
      ctx,
      args.channelId,
      user._id
    );

    if (channel.kind !== "voice") {
      throw new Error("You can only join voice channels.");
    }

    const permissions = await resolveServerPermissions(ctx, member);
    const room = await ctx.db
      .query("callRooms")
      .withIndex("by_scope", (query) =>
        query.eq("scopeType", "voiceChannel").eq("scopeId", args.channelId)
      )
      .unique();
    const voiceState = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .unique();

    return {
      user,
      channel,
      member,
      moderator:
        permissions.admin || permissions.moveMembers || permissions.muteMembers,
      room,
      voiceState,
    };
  },
});

export const joinVoice = action({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining voice.");
    }

    const joinContext = await ctx.runQuery(api.voice.getVoiceJoinContext, args);
    if (!joinContext) {
      throw new Error("Unable to load voice channel.");
    }

    const callRoomId = await ctx.runMutation(
      internal.realtimeCalls.ensureCallRoom,
      {
        scopeId: joinContext.channel._id,
        scopeType: "voiceChannel",
      }
    );
    const room = await ctx.runQuery(internal.realtimeCalls.getRoomById, {
      callRoomId,
    });

    await ctx.runMutation(internal.voice.upsertVoiceState, {
      channelId: joinContext.channel._id,
      serverId: joinContext.channel.serverId,
      userId: current.user._id,
    });

    const currentVoiceState = await ctx.runQuery(api.voice.getSelfState, {});
    const iceServers = await generateTurnIceServers(TURN_TTL_SECONDS);

    return {
      callRoomId,
      channelId: joinContext.channel._id,
      currentDeafened: currentVoiceState?.deafened ?? false,
      currentMuted: currentVoiceState?.muted ?? false,
      displayName: current.user.displayName,
      forcedDeafen: currentVoiceState?.forcedDeafen ?? false,
      forcedMute: currentVoiceState?.forcedMute ?? false,
      iceServers,
      moderator: joinContext.moderator,
      roomKey: resolveRoomKey(room),
      selfUserId: current.user._id,
      serverId: joinContext.channel.serverId,
    };
  },
});

export const connectVoiceSession = action({
  args: {
    callRoomId: v.id("callRooms"),
    channelId: v.id("channels"),
    localAudioMid: v.string(),
    localAudioTrackName: v.string(),
    offer: v.object({
      sdp: v.string(),
      type: v.union(v.literal("offer"), v.literal("answer")),
    }),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining voice.");
    }

    const joinContext = await ctx.runQuery(api.voice.getVoiceJoinContext, {
      channelId: args.channelId,
    });
    if (!joinContext) {
      throw new Error("Unable to load voice channel.");
    }

    return ctx.runAction(internal.realtimeCalls.connectSessionForRoom, {
      callRoomId: args.callRoomId,
      localAudioMid: args.localAudioMid,
      localAudioTrackName: args.localAudioTrackName,
      offer: args.offer,
      scopeId: joinContext.channel._id,
      scopeType: "voiceChannel",
      userId: current.user._id,
    });
  },
});

export const heartbeat = mutation({
  args: {
    serverId: v.id("servers"),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const state = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .unique();

    if (!state) {
      return null;
    }

    await ctx.db.patch(state._id, {
      serverId: args.serverId,
      channelId: args.channelId,
      desiredChannelId: args.channelId,
      lastHeartbeatAt: Date.now(),
    });

    return await ctx.db.get(state._id);
  },
});

export const updateSelfMedia = mutation({
  args: {
    muted: v.boolean(),
    deafened: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const state = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .unique();
    if (!state) {
      return null;
    }

    await ctx.db.patch(state._id, {
      muted: args.muted,
      deafened: args.deafened,
      lastHeartbeatAt: Date.now(),
    });

    return await ctx.db.get(state._id);
  },
});

export const leave = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireCurrentUser(ctx);
    const state = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .unique();

    if (state) {
      await ctx.db.delete(state._id);
    }
  },
});

export const moveMember = mutation({
  args: {
    serverId: v.id("servers"),
    memberUserId: v.id("users"),
    targetChannelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "moveMembers");

    const [targetMember, targetChannel, voiceState] = await Promise.all([
      requireServerMember(ctx, args.serverId, args.memberUserId),
      ctx.db.get(args.targetChannelId),
      ctx.db
        .query("activeVoiceStates")
        .withIndex("by_userId", (query) =>
          query.eq("userId", args.memberUserId)
        )
        .unique(),
    ]);

    if (!targetChannel || targetChannel.kind !== "voice") {
      throw new Error("Target channel must be a voice channel.");
    }

    if (!(await canAccessChannel(ctx, targetChannel, targetMember))) {
      throw new Error("That member cannot access the target voice channel.");
    }

    if (!voiceState) {
      throw new Error("Member is not in voice.");
    }

    await ctx.db.patch(voiceState._id, {
      desiredChannelId: args.targetChannelId,
      lastHeartbeatAt: Date.now(),
    });
  },
});

export const setMemberMute = mutation({
  args: {
    serverId: v.id("servers"),
    memberUserId: v.id("users"),
    forcedMute: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "muteMembers");

    const state = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", args.memberUserId))
      .unique();
    if (!state) {
      throw new Error("Member is not in voice.");
    }

    await ctx.db.patch(state._id, {
      forcedMute: args.forcedMute,
      lastHeartbeatAt: Date.now(),
    });
  },
});

export const setMemberDeafen = mutation({
  args: {
    serverId: v.id("servers"),
    memberUserId: v.id("users"),
    forcedDeafen: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "deafenMembers");

    const state = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", args.memberUserId))
      .unique();
    if (!state) {
      throw new Error("Member is not in voice.");
    }

    await ctx.db.patch(state._id, {
      forcedDeafen: args.forcedDeafen,
      lastHeartbeatAt: Date.now(),
    });
  },
});

export const upsertVoiceState = internalMutation({
  args: {
    userId: v.id("users"),
    serverId: v.id("servers"),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("activeVoiceStates")
      .withIndex("by_userId", (query) => query.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        serverId: args.serverId,
        channelId: args.channelId,
        desiredChannelId: args.channelId,
        lastHeartbeatAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("activeVoiceStates", {
      userId: args.userId,
      serverId: args.serverId,
      channelId: args.channelId,
      desiredChannelId: args.channelId,
      muted: false,
      deafened: false,
      forcedMute: false,
      forcedDeafen: false,
      connectedAt: Date.now(),
      lastHeartbeatAt: Date.now(),
    });
  },
});
