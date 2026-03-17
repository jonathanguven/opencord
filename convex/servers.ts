import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireCurrentUser } from "./lib/auth";
import { canAccessChannel, requireServerMember } from "./lib/permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireCurrentUser(ctx);
    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("by_userId", (query) => query.eq("userId", user._id))
      .collect();

    return Promise.all(
      memberships.map(async (membership) => {
        const server = await ctx.db.get(membership.serverId);
        return {
          ...membership,
          server,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const now = Date.now();

    const serverId = await ctx.db.insert("servers", {
      ownerId: user._id,
      name: args.name.trim(),
      description: args.description?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    const adminRoleId = await ctx.db.insert("roles", {
      serverId,
      name: "Admin",
      position: 100,
      color: "#ff6b35",
      permissions: {
        manageChannels: true,
        createInvites: true,
        moveMembers: true,
        muteMembers: true,
        deafenMembers: true,
        manageRoles: true,
        admin: true,
      },
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("serverMembers", {
      serverId,
      userId: user._id,
      nickname: undefined,
      roleIds: [adminRoleId],
      isOwner: true,
      joinedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("channels", {
      serverId,
      name: "general",
      kind: "text",
      access: "public",
      order: 10,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("channels", {
      serverId,
      name: "lounge",
      kind: "voice",
      access: "public",
      order: 20,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return serverId;
  },
});

export const getWorkspace = query({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const membership = await requireServerMember(ctx, args.serverId, user._id);
    const [server, roles, channels, members, voiceStates] = await Promise.all([
      ctx.db.get(args.serverId),
      ctx.db
        .query("roles")
        .withIndex("by_server_position", (query) => query.eq("serverId", args.serverId))
        .collect(),
      ctx.db
        .query("channels")
        .withIndex("by_server_order", (query) => query.eq("serverId", args.serverId))
        .collect(),
      ctx.db
        .query("serverMembers")
        .withIndex("by_serverId", (query) => query.eq("serverId", args.serverId))
        .collect(),
      ctx.db
        .query("activeVoiceStates")
        .withIndex("by_serverId", (query) => query.eq("serverId", args.serverId))
        .collect(),
    ]);

    const accessibleChannels = (
      await Promise.all(
        channels.map(async (channel) =>
          (await canAccessChannel(ctx, channel, membership)) ? channel : null,
        ),
      )
    ).filter(Boolean);

    const memberUsers = await Promise.all(members.map((member) => ctx.db.get(member.userId)));

    return {
      server,
      membership,
      roles,
      channels: accessibleChannels,
      members: members.map((member, index) => ({
        ...member,
        user: memberUsers[index],
      })),
      voiceStates,
    };
  },
});

export const leave = mutation({
  args: {
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const membership = await requireServerMember(ctx, args.serverId, user._id);

    if (membership.isOwner) {
      throw new Error("Transfer ownership before leaving your own server.");
    }

    await ctx.db.delete(membership._id);
  },
});
