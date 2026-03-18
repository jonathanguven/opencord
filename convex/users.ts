import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { ensureHandleFormat, requireCurrentUser } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);

    return {
      user,
      needsOnboarding: !(user?.handle && user?.displayName),
    };
  },
});

export const bootstrap = mutation({
  args: {
    handle: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    ensureHandleFormat(args.handle);

    const existingHandle = await ctx.db
      .query("users")
      .withIndex("by_handle", (query) =>
        query.eq("handle", args.handle.toLowerCase())
      )
      .unique();

    if (existingHandle && existingHandle._id !== user._id) {
      throw new Error("That handle is already taken.");
    }

    const now = Date.now();
    await ctx.db.patch(user._id, {
      handle: args.handle.toLowerCase(),
      displayName: args.displayName.trim(),
      name: args.displayName.trim(),
      avatarUrl: user.avatarUrl ?? user.image,
      updatedAt: now,
    });

    return await ctx.db.get(user._id);
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      displayName: args.displayName.trim(),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(user._id);
  },
});

export const search = query({
  args: {
    handleQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    if (args.handleQuery.trim().length < 2) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();
    const needle = args.handleQuery.trim().toLowerCase();

    return allUsers
      .filter(
        (candidate) =>
          candidate._id !== user._id &&
          candidate.handle?.toLowerCase().includes(needle)
      )
      .slice(0, 10)
      .map((candidate) => ({
        _id: candidate._id,
        handle: candidate.handle ?? "",
        displayName: candidate.displayName ?? candidate.name ?? "OpenCord User",
        avatarUrl: candidate.avatarUrl ?? candidate.image ?? null,
      }));
  },
});
