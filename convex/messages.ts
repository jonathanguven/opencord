import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireCurrentUser } from "./lib/auth";
import { requireChannelAccess } from "./lib/permissions";

const ensureThreadAccess = async (
  ctx: any,
  userId: string,
  args: { threadType: "dm" | "channel"; threadId: string },
) => {
  if (args.threadType === "channel") {
    await requireChannelAccess(ctx, args.threadId, userId);
    return;
  }

  const conversation = await ctx.db.get(args.threadId);
  if (!conversation || !conversation.participantIds.includes(userId)) {
    throw new Error("Conversation not found.");
  }
};

export const list = query({
  args: {
    threadType: v.union(v.literal("dm"), v.literal("channel")),
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await ensureThreadAccess(ctx, user._id, args);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (query) =>
        query.eq("threadType", args.threadType).eq("threadId", args.threadId),
      )
      .order("desc")
      .take(args.limit ?? 50);

    const hydrated = await Promise.all(
      messages.reverse().map(async (message) => ({
        ...message,
        author: await ctx.db.get(message.authorId),
      })),
    );

    return hydrated;
  },
});

export const send = mutation({
  args: {
    threadType: v.union(v.literal("dm"), v.literal("channel")),
    threadId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const body = args.body.trim();
    if (!body) {
      throw new Error("Message body cannot be empty.");
    }

    await ensureThreadAccess(ctx, user._id, args);

    const messageId = await ctx.db.insert("messages", {
      threadType: args.threadType,
      threadId: args.threadId,
      authorId: user._id,
      body,
      createdAt: Date.now(),
      editedAt: undefined,
    });

    if (args.threadType === "dm") {
      await ctx.db.patch(args.threadId as any, {
        updatedAt: Date.now(),
      });
    }

    return messageId;
  },
});
