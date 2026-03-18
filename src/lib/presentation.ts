import type { Doc } from "../../convex/_generated/dataModel";

const WHITESPACE_RE = /\s+/;

type DisplayableUser =
  | Doc<"users">
  | {
      displayName?: string | null;
      name?: string | null;
    }
  | null
  | undefined;

export function getDisplayName(user: DisplayableUser) {
  if (!user) {
    return "OpenCord User";
  }

  if ("displayName" in user && user.displayName) {
    return user.displayName;
  }

  if ("name" in user && user.name) {
    return user.name;
  }

  return "OpenCord User";
}

export function getInitials(value: string) {
  return value
    .split(WHITESPACE_RE)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
