import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";

import { requireCurrentUser } from "./lib/auth";
import { requireChannelAccess } from "./lib/permissions";

type DbCtx = MutationCtx | QueryCtx;

const ensureThreadAccess = async (
  ctx: DbCtx,
  userId: Id<"users">,
  args: {
    threadId: Id<"channels"> | Id<"conversations">;
    threadType: "dm" | "channel";
  },
  options?: {
    allowMissing?: boolean;
  }
) => {
  if (args.threadType === "channel") {
    try {
      await requireChannelAccess(ctx, args.threadId as Id<"channels">, userId);
      return true;
    } catch (error) {
      if (
        options?.allowMissing &&
        error instanceof Error &&
        error.message === "Channel not found."
      ) {
        return false;
      }

      throw error;
    }
  }

  const conversation = await ctx.db.get(args.threadId as Id<"conversations">);
  if (!conversation) {
    if (options?.allowMissing) {
      return false;
    }

    throw new Error("Conversation not found.");
  }

  if (!conversation?.participantIds.includes(userId)) {
    throw new Error("Conversation not found.");
  }

  return true;
};

export const list = query({
  args: {
    threadType: v.union(v.literal("dm"), v.literal("channel")),
    threadId: v.union(v.id("channels"), v.id("conversations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const canReadThread = await ensureThreadAccess(ctx, user._id, args, {
      allowMissing: true,
    });
    if (!canReadThread) {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (query) =>
        query.eq("threadType", args.threadType).eq("threadId", args.threadId)
      )
      .order("desc")
      .take(args.limit ?? 50);

    const hydrated = await Promise.all(
      messages.reverse().map(async (message) => ({
        ...message,
        author: await ctx.db.get(message.authorId),
      }))
    );

    return hydrated;
  },
});

export const send = mutation({
  args: {
    threadType: v.union(v.literal("dm"), v.literal("channel")),
    threadId: v.union(v.id("channels"), v.id("conversations")),
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
      await ctx.db.patch(args.threadId as Id<"conversations">, {
        updatedAt: Date.now(),
      });
    }

    return messageId;
  },
});

const requireOwnedMessage = async (
  ctx: MutationCtx,
  messageId: Id<"messages">,
  userId: Id<"users">
) => {
  const message = await ctx.db.get(messageId);
  if (!message) {
    throw new Error("Message not found.");
  }

  await ensureThreadAccess(ctx, userId, {
    threadId: message.threadId as Id<"channels"> | Id<"conversations">,
    threadType: message.threadType,
  });

  if (message.authorId !== userId) {
    throw new Error("You can only change your own messages.");
  }

  return message;
};

export const edit = mutation({
  args: {
    messageId: v.id("messages"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const body = args.body.trim();
    if (!body) {
      throw new Error("Message body cannot be empty.");
    }

    await requireOwnedMessage(ctx, args.messageId, user._id);

    await ctx.db.patch(args.messageId, {
      body,
      editedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requireOwnedMessage(ctx, args.messageId, user._id);
    await ctx.db.delete(args.messageId);
  },
});
