import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireCurrentUser } from "./lib/auth";
import { normalizePairKey } from "../shared/permissions";

const ensureConversationAccess = async (ctx: any, conversationId: string, userId: string) => {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || !conversation.participantIds.includes(userId)) {
    throw new Error("Conversation not found.");
  }
  return conversation;
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireCurrentUser(ctx);
    const [left, right] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_participantAId", (query) => query.eq("participantAId", user._id))
        .collect(),
      ctx.db
        .query("conversations")
        .withIndex("by_participantBId", (query) => query.eq("participantBId", user._id))
        .collect(),
    ]);
    const conversations = [...left, ...right].sort((a, b) => b.updatedAt - a.updatedAt);

    return Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.participantIds.find((participantId) => participantId !== user._id);
        const [otherUser, latestMessage, callSessions] = await Promise.all([
          otherUserId ? ctx.db.get(otherUserId) : null,
          ctx.db
            .query("messages")
            .withIndex("by_thread", (query) =>
              query.eq("threadType", "dm").eq("threadId", conversation._id),
            )
            .order("desc")
            .first(),
          ctx.db
            .query("dmCallSessions")
            .withIndex("by_conversationId", (query) =>
              query.eq("conversationId", conversation._id),
            )
            .collect(),
        ]);

        return {
          ...conversation,
          otherUser,
          latestMessage,
          activeCall: callSessions.find((session) => session.status !== "ended") ?? null,
        };
      }),
    );
  },
});

export const get = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    return ensureConversationAccess(ctx, args.conversationId, user._id);
  },
});

export const getOrCreateByFriend = mutation({
  args: {
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const pairKey = normalizePairKey(user._id, args.friendId);
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_pairKey", (query) => query.eq("pairKey", pairKey))
      .unique();

    if (!friendship) {
      throw new Error("You can only DM people in your friend list.");
    }

    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_pairKey", (query) => query.eq("pairKey", pairKey))
      .unique();

    if (existingConversation) {
      return existingConversation._id;
    }

    return ctx.db.insert("conversations", {
      kind: "dm",
      participantIds: [user._id, args.friendId].sort(),
      participantAId: user._id < args.friendId ? user._id : args.friendId,
      participantBId: user._id < args.friendId ? args.friendId : user._id,
      pairKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
