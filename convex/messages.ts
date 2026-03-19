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
import { r2 } from "./r2";

type DbCtx = MutationCtx | QueryCtx;
const MESSAGE_IMAGE_URL_TTL_SECONDS = 60 * 60;

const getMessageUpload = async (ctx: DbCtx, key: string) =>
  ctx.db
    .query("messageUploads")
    .withIndex("by_key", (query) => query.eq("key", key))
    .unique();

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
      messages.reverse().map(async (message) => {
        const [author, imageUrl] = await Promise.all([
          ctx.db.get(message.authorId),
          message.imageKey
            ? r2.getUrl(message.imageKey, {
                expiresIn: MESSAGE_IMAGE_URL_TTL_SECONDS,
              })
            : Promise.resolve(null),
        ]);

        return {
          ...message,
          author,
          imageUrl,
        };
      })
    );

    return hydrated;
  },
});

export const send = mutation({
  args: {
    threadType: v.union(v.literal("dm"), v.literal("channel")),
    threadId: v.union(v.id("channels"), v.id("conversations")),
    body: v.string(),
    imageKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const body = args.body.trim();
    const imageKey = args.imageKey?.trim() || undefined;

    await ensureThreadAccess(ctx, user._id, args);

    if (!(body || imageKey)) {
      throw new Error("Message body cannot be empty.");
    }

    const imageMetadata = imageKey ? await r2.getMetadata(ctx, imageKey) : null;
    const imageUpload = imageKey ? await getMessageUpload(ctx, imageKey) : null;
    if (imageKey && !imageMetadata) {
      throw new Error("Image upload could not be found.");
    }
    if (imageKey && !imageUpload) {
      throw new Error("Image upload could not be found.");
    }
    if (imageUpload && imageUpload.authorId !== user._id) {
      throw new Error("You can only attach images that you uploaded.");
    }
    if (imageUpload?.messageId) {
      throw new Error("This image has already been attached to a message.");
    }
    if (
      imageMetadata?.contentType &&
      !imageMetadata.contentType.startsWith("image/")
    ) {
      throw new Error("Only image uploads can be attached to messages.");
    }

    const messageId = await ctx.db.insert("messages", {
      threadType: args.threadType,
      threadId: args.threadId,
      authorId: user._id,
      body,
      imageContentType: imageMetadata?.contentType,
      imageKey,
      imageSize: imageMetadata?.size,
      createdAt: Date.now(),
      editedAt: undefined,
    });

    if (args.threadType === "dm") {
      await ctx.db.patch(args.threadId as Id<"conversations">, {
        updatedAt: Date.now(),
      });
    }

    if (imageUpload) {
      await ctx.db.patch(imageUpload._id, {
        messageId,
        usedAt: Date.now(),
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
    const message = await requireOwnedMessage(ctx, args.messageId, user._id);

    if (message.imageKey) {
      const upload = await getMessageUpload(ctx, message.imageKey);
      await r2.deleteObject(ctx, message.imageKey);
      if (upload) {
        await ctx.db.delete(upload._id);
      }
    }

    await ctx.db.delete(args.messageId);
  },
});

export const removeImage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const message = await requireOwnedMessage(ctx, args.messageId, user._id);

    if (!message.imageKey) {
      throw new Error("Message does not have an image attachment.");
    }

    if (!message.body.trim()) {
      throw new Error("Delete the whole message when only an image remains.");
    }

    const upload = await getMessageUpload(ctx, message.imageKey);
    await r2.deleteObject(ctx, message.imageKey);

    if (upload) {
      await ctx.db.delete(upload._id);
    }

    await ctx.db.patch(args.messageId, {
      imageContentType: undefined,
      imageKey: undefined,
      imageSize: undefined,
    });
  },
});
