import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

import {
  createDownloadUrl as createR2DownloadUrl,
  createUploadUrl as createR2UploadUrl,
  getStorageStatus,
} from "./lib/storage";

export const status = action({
  args: {},
  handler: async (ctx) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before checking storage.");
    }
    return getStorageStatus();
  },
});

export const createUploadUrl = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before creating upload URLs.");
    }
    return createR2UploadUrl(args.key);
  },
});

export const createDownloadUrl = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before creating download URLs.");
    }
    return createR2DownloadUrl(args.key);
  },
});
