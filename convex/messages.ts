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
  }
) => {
  if (args.threadType === "channel") {
    await requireChannelAccess(ctx, args.threadId as Id<"channels">, userId);
    return;
  }

  const conversation = await ctx.db.get(args.threadId as Id<"conversations">);
  if (!conversation?.participantIds.includes(userId)) {
    throw new Error("Conversation not found.");
  }
};

export const list = query({
  args: {
    threadType: v.union(v.literal("dm"), v.literal("channel")),
    threadId: v.union(v.id("channels"), v.id("conversations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await ensureThreadAccess(ctx, user._id, args);

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
