import type { WorkspaceResult } from "@/components/workspace/workspace-types";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { PermissionSet } from "../../shared/domain";
import { mergePermissionSets } from "../../shared/permissions";

const CHANNELS_PATH = "/channels";
const LAST_CHANNEL_STORAGE_KEY_PREFIX = "opencord:last-channel:";
const INVITE_CODE_PATTERN = /^[A-Za-z0-9-]+$/;
const INVITE_PATH_PATTERN = /^\/invite\/([A-Za-z0-9-]+)\/?$/;

export function getDmPath(conversationId: Id<"conversations">) {
  return `${CHANNELS_PATH}/dm/${conversationId}`;
}

export function getServerPath(serverId: Id<"servers">) {
  return `${CHANNELS_PATH}/${serverId}`;
}

export function getChannelPath(
  serverId: Id<"servers">,
  channelId: Id<"channels">
) {
  return `${CHANNELS_PATH}/${serverId}/${channelId}`;
}

function getLastChannelStorageKey(serverId: Id<"servers">) {
  return `${LAST_CHANNEL_STORAGE_KEY_PREFIX}${serverId}`;
}

function getLastVisitedChannel(serverId: Id<"servers">) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(
    getLastChannelStorageKey(serverId)
  ) as Id<"channels"> | null;
}

export function setLastVisitedChannel(
  serverId: Id<"servers">,
  channelId: Id<"channels">
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getLastChannelStorageKey(serverId), channelId);
}

export function resolveServerLandingChannel(
  serverId: Id<"servers">,
  channels: Doc<"channels">[]
) {
  const lastVisitedChannelId = getLastVisitedChannel(serverId);
  const lastVisitedChannel = lastVisitedChannelId
    ? (channels.find((channel) => channel._id === lastVisitedChannelId) ?? null)
    : null;

  if (lastVisitedChannel) {
    return lastVisitedChannel;
  }

  return (
    channels.find((channel) => channel.kind === "text") ?? channels[0] ?? null
  );
}

export function buildInviteLink(code: string) {
  if (typeof window === "undefined") {
    return `https://opencord.app/invite/${code}`;
  }

  return new URL(`/invite/${code}`, window.location.origin).toString();
}

export function parseInviteCode(input: string) {
  const normalizedValue = input.trim();
  if (!normalizedValue) {
    return null;
  }

  if (!(normalizedValue.includes("://") || normalizedValue.startsWith("/"))) {
    return INVITE_CODE_PATTERN.test(normalizedValue) ? normalizedValue : null;
  }

  try {
    const origin =
      typeof window === "undefined"
        ? "https://opencord.app"
        : window.location.origin;
    const inviteUrl = new URL(normalizedValue, origin);
    const invitePathMatch = inviteUrl.pathname.match(INVITE_PATH_PATTERN);

    return invitePathMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export function resolvePermissions(workspace: WorkspaceResult) {
  if (workspace.membership.isOwner) {
    return {
      admin: true,
      createInvites: true,
      deafenMembers: true,
      manageChannels: true,
      manageRoles: true,
      moveMembers: true,
      muteMembers: true,
    } satisfies PermissionSet;
  }

  const assignedRoles = workspace.roles.filter((role) =>
    workspace.membership.roleIds.includes(role._id)
  );

  return mergePermissionSets(assignedRoles);
}

export function canCreateInvites(workspace: WorkspaceResult | undefined) {
  if (!workspace) {
    return false;
  }

  const permissions = resolvePermissions(workspace);
  return permissions.admin || permissions.createInvites;
}
