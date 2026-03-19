import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

const TRAILING_SLASH_PATTERN = /\/$/;

const normalizeR2Endpoint = (endpoint: string | undefined) => {
  if (!endpoint) {
    return undefined;
  }

  return endpoint
    .replace(".r2.storage.com", ".r2.cloudflarestorage.com")
    .replace(TRAILING_SLASH_PATTERN, "");
};

export const r2 = new R2(components.r2, {
  endpoint: normalizeR2Endpoint(process.env.R2_ENDPOINT),
});

export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({
  checkUpload: async (ctx) => {
    await requireCurrentUser(ctx);
  },
  onUpload: async (ctx, _bucket, key) => {
    const { user } = await requireCurrentUser(ctx);
    const existingUpload = await ctx.db
      .query("messageUploads")
      .withIndex("by_key", (query) => query.eq("key", key))
      .unique();

    if (existingUpload) {
      await ctx.db.patch(existingUpload._id, {
        authorId: user._id,
        createdAt: existingUpload.createdAt || Date.now(),
      });
      return;
    }

    await ctx.db.insert("messageUploads", {
      authorId: user._id,
      createdAt: Date.now(),
      key,
    });
  },
});

export const deleteObject = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const upload = await ctx.db
      .query("messageUploads")
      .withIndex("by_key", (query) => query.eq("key", args.key))
      .unique();

    if (!upload || upload.authorId !== user._id) {
      throw new Error("Upload not found.");
    }

    if (upload.messageId) {
      throw new Error(
        "Attached uploads cannot be removed from the draft menu."
      );
    }

    await r2.deleteObject(ctx, args.key);
    await ctx.db.delete(upload._id);
  },
});
