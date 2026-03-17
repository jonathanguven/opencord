import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const log = internalMutation({
  args: {
    actorUserId: v.optional(v.id("users")),
    eventType: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
