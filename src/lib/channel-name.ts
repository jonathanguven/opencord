import type { Doc } from "../../convex/_generated/dataModel";

const LEADING_TEXT_CHANNEL_HASHES_PATTERN = /^#+\s*/;

export const normalizeTextChannelName = (name: string) =>
  name.trim().replace(LEADING_TEXT_CHANNEL_HASHES_PATTERN, "");

export const getChannelNameText = (channel: Doc<"channels">) =>
  channel.kind === "text"
    ? normalizeTextChannelName(channel.name)
    : channel.name;

export const getChannelDisplayName = (channel: Doc<"channels">) =>
  channel.kind === "text" ? `# ${getChannelNameText(channel)}` : channel.name;
