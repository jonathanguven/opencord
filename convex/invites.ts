import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireCurrentUser } from "./lib/auth";
import { requirePermission } from "./lib/permissions";

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const list = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "createInvites");
    return ctx.db
      .query("invites")
      .withIndex("by_serverId", (query) => query.eq("serverId", args.serverId))
      .collect();
  },
});

export const create = mutation({
  args: {
    serverId: v.id("servers"),
    expiresAt: v.optional(v.number()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "createInvites");

    const code = randomCode();
    const inviteId = await ctx.db.insert("invites", {
      serverId: args.serverId,
      code,
      createdBy: user._id,
      expiresAt: args.expiresAt,
      maxUses: args.maxUses,
      useCount: 0,
      revokedAt: undefined,
      createdAt: Date.now(),
    });

    return {
      inviteId,
      code,
    };
  },
});

export const revoke = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found.");
    }

    await requirePermission(ctx, invite.serverId, user._id, "createInvites");
    await ctx.db.patch(args.inviteId, {
      revokedAt: Date.now(),
    });
  },
});

export const redeem = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (query) => query.eq("code", args.code.toUpperCase()))
      .unique();

    if (!invite || invite.revokedAt) {
      throw new Error("Invite is invalid.");
    }

    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new Error("Invite has expired.");
    }

    if (invite.maxUses && invite.useCount >= invite.maxUses) {
      throw new Error("Invite has reached its usage limit.");
    }

    const existingMembership = await ctx.db
      .query("serverMembers")
      .withIndex("by_server_user", (query) =>
        query.eq("serverId", invite.serverId).eq("userId", user._id),
      )
      .unique();

    if (!existingMembership) {
      await ctx.db.insert("serverMembers", {
        serverId: invite.serverId,
        userId: user._id,
        nickname: undefined,
        roleIds: [],
        isOwner: false,
        joinedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(invite._id, {
      useCount: invite.useCount + 1,
    });

    return invite.serverId;
  },
});
