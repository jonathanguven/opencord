// @ts-nocheck
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

import { requireCurrentUser } from "./lib/auth";
import { addRealtimeParticipant, createRealtimeMeeting } from "./lib/cloudflare";

const requireConversationParticipant = async (ctx: any, conversationId: string, userId: string) => {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || !conversation.participantIds.includes(userId)) {
    throw new Error("Conversation not found.");
  }
  return conversation;
};

export const getDmCallContext = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const conversation = await requireConversationParticipant(ctx, args.conversationId, user._id);
    const room = await ctx.db
      .query("callRooms")
      .withIndex("by_scope", (query) => query.eq("scopeType", "dm").eq("scopeId", args.conversationId))
      .unique();
    return { user, conversation, room };
  },
});

export const startDmCall = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requireConversationParticipant(ctx, args.conversationId, user._id);

    const existing = await ctx.db
      .query("dmCallSessions")
      .withIndex("by_conversationId", (query) => query.eq("conversationId", args.conversationId))
      .collect();
    const active = existing.find((session) => session.status !== "ended");

    if (active) {
      return active._id;
    }

    return ctx.db.insert("dmCallSessions", {
      conversationId: args.conversationId,
      startedBy: user._id,
      status: "ringing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      endedAt: undefined,
    });
  },
});

export const endDmCall = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requireConversationParticipant(ctx, args.conversationId, user._id);

    const sessions = await ctx.db
      .query("dmCallSessions")
      .withIndex("by_conversationId", (query) => query.eq("conversationId", args.conversationId))
      .collect();
    const active = sessions.find((session) => session.status !== "ended");

    if (active) {
      await ctx.db.patch(active._id, {
        status: "ended",
        endedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const joinDmCall = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining calls.");
    }

    const joinContext = await ctx.runQuery(api.calls.getDmCallContext, args);
    if (!joinContext) {
      throw new Error("Unable to load DM call.");
    }

    let room = joinContext.room;
    if (!room) {
      const meeting = await createRealtimeMeeting(`dm-${args.conversationId}`);
      await ctx.runMutation(internal.voice.upsertCallRoom, {
        scopeType: "dm",
        scopeId: args.conversationId,
        meetingId: meeting.id,
      });
      room = await ctx.runQuery(api.calls.getDmCallContext, args).then((value) => value?.room);
    }

    if (!room) {
      throw new Error("Unable to create a DM room.");
    }

    const participant = await addRealtimeParticipant({
      meetingId: room.meetingId,
      displayName: current.user.displayName,
      customParticipantId: current.user._id,
      moderator: true,
    });

    await ctx.runMutation(internal.calls.markDmCallActive, {
      conversationId: args.conversationId,
      actorUserId: current.user._id,
    });

    return {
      authToken: participant.authToken,
      participantId: participant.participantId,
      meetingId: room.meetingId,
      conversationId: args.conversationId,
    };
  },
});

export const markDmCallActive = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("dmCallSessions")
      .withIndex("by_conversationId", (query) => query.eq("conversationId", args.conversationId))
      .collect();
    const active = sessions.find((session) => session.status !== "ended");

    if (active) {
      await ctx.db.patch(active._id, {
        status: "active",
        updatedAt: Date.now(),
      });
      return active._id;
    }

    return ctx.db.insert("dmCallSessions", {
      conversationId: args.conversationId,
      startedBy: args.actorUserId,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      endedAt: undefined,
    });
  },
});
