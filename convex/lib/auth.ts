import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./../_generated/server";

const HANDLE_PATTERN = /^[a-z0-9_]{3,24}$/i;

type AuthCtx = MutationCtx | QueryCtx;

export const requireCurrentUser = async (ctx: AuthCtx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("Finish onboarding before continuing.");
  }

  return { user };
};

export const ensureHandleFormat = (handle: string) => {
  if (!HANDLE_PATTERN.test(handle)) {
    throw new Error(
      "Handles must be 3-24 characters and only include letters, numbers, or underscores."
    );
  }
};
