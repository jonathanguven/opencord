import { hasPermission, mergePermissionSets } from "../../shared/permissions";

export const getServerMember = async (ctx: any, serverId: string, userId: string) => {
  return ctx.db
    .query("serverMembers")
    .withIndex("by_server_user", (query: any) =>
      query.eq("serverId", serverId).eq("userId", userId),
    )
    .unique();
};

export const requireServerMember = async (ctx: any, serverId: string, userId: string) => {
  const member = await getServerMember(ctx, serverId, userId);
  if (!member) {
    throw new Error("You are not a member of this server.");
  }
  return member;
};

export const resolveServerPermissions = async (ctx: any, member: any) => {
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

  const roles = await Promise.all(member.roleIds.map((roleId: string) => ctx.db.get(roleId)));
  return mergePermissionSets(roles.filter(Boolean));
};

export const requirePermission = async (
  ctx: any,
  serverId: string,
  userId: string,
  permission: Parameters<typeof hasPermission>[1],
) => {
  const member = await requireServerMember(ctx, serverId, userId);
  const permissions = await resolveServerPermissions(ctx, member);

  if (!hasPermission(permissions, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }

  return { member, permissions };
};

export const canAccessChannel = async (ctx: any, channel: any, member: any) => {
  if (channel.access === "public" || member.isOwner) {
    return true;
  }

  const permissions = await resolveServerPermissions(ctx, member);
  if (permissions.admin) {
    return true;
  }

  const rules = await ctx.db
    .query("channelAccessRules")
    .withIndex("by_channelId", (query: any) => query.eq("channelId", channel._id))
    .collect();

  if (rules.some((rule: any) => rule.userId === member.userId)) {
    return true;
  }

  return rules.some((rule: any) => rule.roleId && member.roleIds.includes(rule.roleId));
};

export const requireChannelAccess = async (ctx: any, channelId: string, userId: string) => {
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
