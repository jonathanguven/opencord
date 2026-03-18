import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { requireCurrentUser } from "./lib/auth";
import { requirePermission, requireServerMember } from "./lib/permissions";

const permissionValidator = v.object({
  manageChannels: v.boolean(),
  createInvites: v.boolean(),
  moveMembers: v.boolean(),
  muteMembers: v.boolean(),
  deafenMembers: v.boolean(),
  manageRoles: v.boolean(),
  admin: v.boolean(),
});

export const list = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requireServerMember(ctx, args.serverId, user._id);
    return ctx.db
      .query("roles")
      .withIndex("by_server_position", (query) =>
        query.eq("serverId", args.serverId)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    serverId: v.id("servers"),
    name: v.string(),
    color: v.optional(v.string()),
    position: v.number(),
    permissions: permissionValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "manageRoles");

    return ctx.db.insert("roles", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.string(),
    color: v.optional(v.string()),
    position: v.number(),
    permissions: permissionValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found.");
    }

    await requirePermission(ctx, role.serverId, user._id, "manageRoles");
    await ctx.db.patch(args.roleId, {
      name: args.name.trim(),
      color: args.color,
      position: args.position,
      permissions: args.permissions,
      updatedAt: Date.now(),
    });
  },
});

export const assignToMember = mutation({
  args: {
    serverId: v.id("servers"),
    memberUserId: v.id("users"),
    roleIds: v.array(v.id("roles")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requirePermission(ctx, args.serverId, user._id, "manageRoles");
    const member = await requireServerMember(
      ctx,
      args.serverId,
      args.memberUserId
    );

    await ctx.db.patch(member._id, {
      roleIds: args.roleIds,
      updatedAt: Date.now(),
    });
  },
});
