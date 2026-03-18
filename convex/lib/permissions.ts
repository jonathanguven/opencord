import { defaultPermissionSet } from "../../shared/domain";
import { hasPermission, mergePermissionSets } from "../../shared/permissions";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = MutationCtx | QueryCtx;
const isPresent = <T>(value: T | null): value is T => value !== null;

export const getServerMember = (
  ctx: DbCtx,
  serverId: Id<"servers">,
  userId: Id<"users">
) => {
  return ctx.db
    .query("serverMembers")
    .withIndex("by_server_user", (query) =>
      query.eq("serverId", serverId).eq("userId", userId)
    )
    .unique();
};

export const requireServerMember = async (
  ctx: DbCtx,
  serverId: Id<"servers">,
  userId: Id<"users">
) => {
  const member = await getServerMember(ctx, serverId, userId);
  if (!member) {
    throw new Error("You are not a member of this server.");
  }
  return member;
};

export const resolveServerPermissions = async (
  ctx: DbCtx,
  member: Doc<"serverMembers">
) => {
  if (member.isOwner) {
    return {
      manageChannels: true,
      createInvites: true,
      moveMembers: true,
      muteMembers: true,
      deafenMembers: true,
      manageRoles: true,
      admin: true,
    };
  }

  const roles = await Promise.all(
    member.roleIds.map((roleId) => ctx.db.get(roleId))
  );
  return mergePermissionSets(roles.filter(isPresent)) ?? defaultPermissionSet();
};

export const requirePermission = async (
  ctx: DbCtx,
  serverId: Id<"servers">,
  userId: Id<"users">,
  permission: Parameters<typeof hasPermission>[1]
) => {
  const member = await requireServerMember(ctx, serverId, userId);
  const permissions = await resolveServerPermissions(ctx, member);

  if (!hasPermission(permissions, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }

  return { member, permissions };
};

export const canAccessChannel = async (
  ctx: DbCtx,
  channel: Doc<"channels">,
  member: Doc<"serverMembers">
) => {
  if (channel.access === "public" || member.isOwner) {
    return true;
  }

  const permissions = await resolveServerPermissions(ctx, member);
  if (permissions.admin) {
    return true;
  }

  const rules = await ctx.db
    .query("channelAccessRules")
    .withIndex("by_channelId", (query) => query.eq("channelId", channel._id))
    .collect();

  if (rules.some((rule) => rule.userId === member.userId)) {
    return true;
  }

  return rules.some(
    (rule) => rule.roleId && member.roleIds.includes(rule.roleId)
  );
};

export const requireChannelAccess = async (
  ctx: DbCtx,
  channelId: Id<"channels">,
  userId: Id<"users">
) => {
  const channel = await ctx.db.get(channelId);
  if (!channel) {
    throw new Error("Channel not found.");
  }

  const member = await requireServerMember(ctx, channel.serverId, userId);
  const allowed = await canAccessChannel(ctx, channel, member);

  if (!allowed) {
    throw new Error("You do not have access to this channel.");
  }

  return { channel, member };
};
