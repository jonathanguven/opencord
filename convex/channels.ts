import { mutation } from "./_generated/server";
import { v } from "convex/values";

import { requireCurrentUser } from "./lib/auth";
import { requirePermission } from "./lib/permissions";

export const create = mutation({
  args: {
    serverId: v.id("servers"),
    name: v.string(),
    kind: v.union(v.literal("text"), v.literal("voice")),
    access: v.union(v.literal("public"), v.literal("private")),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "manageChannels");

    return ctx.db.insert("channels", {
      ...args,
      name: args.name.trim(),
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.string(),
    access: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    await requirePermission(ctx, channel.serverId, user._id, "manageChannels");
    await ctx.db.patch(args.channelId, {
      name: args.name.trim(),
      access: args.access,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    await requirePermission(ctx, channel.serverId, user._id, "manageChannels");
    await ctx.db.delete(args.channelId);
  },
});

export const reorder = mutation({
  args: {
    serverId: v.id("servers"),
    orderedChannelIds: v.array(v.id("channels")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "manageChannels");

    await Promise.all(
      args.orderedChannelIds.map((channelId, index) =>
        ctx.db.patch(channelId, {
          order: (index + 1) * 10,
          updatedAt: Date.now(),
        }),
      ),
    );
  },
});

export const grantAccess = mutation({
  args: {
    channelId: v.id("channels"),
    roleId: v.optional(v.id("roles")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    await requirePermission(ctx, channel.serverId, user._id, "manageChannels");

    return ctx.db.insert("channelAccessRules", {
      channelId: args.channelId,
      roleId: args.roleId,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

export const revokeAccess = mutation({
  args: {
    ruleId: v.id("channelAccessRules"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error("Access rule not found.");
    }

    const channel = await ctx.db.get(rule.channelId);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    await requirePermission(ctx, channel.serverId, user._id, "manageChannels");
    await ctx.db.delete(args.ruleId);
  },
});
