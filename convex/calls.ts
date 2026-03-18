import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";

import { requireCurrentUser } from "./lib/auth";
import { generateTurnIceServers } from "./lib/cloudflare";

const TURN_TTL_SECONDS = 60 * 60 * 4;

const resolveRoomKey = (room: { roomKey?: string; scopeId: string }) =>
  room.roomKey ?? `dm:${room.scopeId}`;

type DbCtx = MutationCtx | QueryCtx;
interface ConnectDmCallSessionResult {
  audioTrackName: string;
  publishedMid: string;
  requiresImmediateRenegotiation: boolean;
  sessionDescription:
    | {
        sdp: string;
        type: "answer" | "offer";
      }
    | undefined;
  sessionId: string;
}
interface JoinDmCallResult {
  callRoomId: Id<"callRooms">;
  displayName: string | null | undefined;
  iceServers: Array<{
    credential?: string;
    urls: string[];
    username?: string;
  }>;
  moderator: boolean;
  roomKey: string;
  selfUserId: Id<"users">;
}

const requireConversationParticipant = async (
  ctx: DbCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">
) => {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation?.participantIds.includes(userId)) {
    throw new Error("Conversation not found.");
  }
  return conversation;
};

export const getDmCallContext = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const conversation = await requireConversationParticipant(
      ctx,
      args.conversationId,
      user._id
    );
    const room = await ctx.db
      .query("callRooms")
      .withIndex("by_scope", (query) =>
        query.eq("scopeType", "dm").eq("scopeId", args.conversationId)
      )
      .unique();
    const participant = room
      ? await ctx.db
          .query("callRoomParticipants")
          .withIndex("by_user_callRoom", (query) =>
            query.eq("userId", user._id).eq("callRoomId", room._id)
          )
          .unique()
      : null;

    return { user, conversation, participant, room };
  },
});

export const startDmCall = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requireConversationParticipant(ctx, args.conversationId, user._id);

    const existing = await ctx.db
      .query("dmCallSessions")
      .withIndex("by_conversationId", (query) =>
        query.eq("conversationId", args.conversationId)
      )
      .collect();
    const active = existing.find((session) => session.status !== "ended");

    if (active) {
      return active._id;
    }

    return ctx.db.insert("dmCallSessions", {
      conversationId: args.conversationId,
      startedBy: user._id,
      status: "ringing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      endedAt: undefined,
    });
  },
});

export const endDmCall = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    await requireConversationParticipant(ctx, args.conversationId, user._id);

    const sessions = await ctx.db
      .query("dmCallSessions")
      .withIndex("by_conversationId", (query) =>
        query.eq("conversationId", args.conversationId)
      )
      .collect();
    const active = sessions.find((session) => session.status !== "ended");

    if (active) {
      await ctx.db.patch(active._id, {
        status: "ended",
        endedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const joinDmCall = action({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args): Promise<JoinDmCallResult> => {
    const current: {
      user?: { _id: Id<"users">; displayName?: string | null } | null;
    } | null = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining calls.");
    }

    const joinContext = await ctx.runQuery(api.calls.getDmCallContext, args);
    if (!joinContext) {
      throw new Error("Unable to load DM call.");
    }

    const callRoomId: Id<"callRooms"> = await ctx.runMutation(
      internal.realtimeCalls.ensureCallRoom,
      {
        scopeId: args.conversationId,
        scopeType: "dm",
      }
    );
    const room: { roomKey?: string; scopeId: string } | null =
      await ctx.runQuery(internal.realtimeCalls.getRoomById, {
        callRoomId,
      });
    const iceServers = await generateTurnIceServers(TURN_TTL_SECONDS);

    if (!room) {
      throw new Error("Call room not found.");
    }

    return {
      callRoomId,
      displayName: current.user.displayName,
      iceServers,
      moderator: true,
      roomKey: resolveRoomKey(room),
      selfUserId: current.user._id,
    };
  },
});

export const connectDmCallSession = action({
  args: {
    conversationId: v.id("conversations"),
    callRoomId: v.id("callRooms"),
    localAudioMid: v.string(),
    localAudioTrackName: v.string(),
    offer: v.object({
      sdp: v.string(),
      type: v.union(v.literal("offer"), v.literal("answer")),
    }),
  },
  handler: async (ctx, args): Promise<ConnectDmCallSessionResult> => {
    const current = await ctx.runQuery(api.users.current, {});
    if (!current?.user) {
      throw new Error("Finish onboarding before joining calls.");
    }

    await ctx.runQuery(api.calls.getDmCallContext, {
      conversationId: args.conversationId,
    });

    const result: ConnectDmCallSessionResult = await ctx.runAction(
      internal.realtimeCalls.connectSessionForRoom,
      {
        callRoomId: args.callRoomId,
        localAudioMid: args.localAudioMid,
        localAudioTrackName: args.localAudioTrackName,
        offer: args.offer,
        scopeId: args.conversationId,
        scopeType: "dm",
        userId: current.user._id,
      }
    );

    await ctx.runMutation(internal.calls.markDmCallActive, {
      actorUserId: current.user._id,
      conversationId: args.conversationId,
    });

    return result;
  },
});

export const markDmCallActive = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    actorUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("dmCallSessions")
      .withIndex("by_conversationId", (query) =>
        query.eq("conversationId", args.conversationId)
      )
      .collect();
    const active = sessions.find((session) => session.status !== "ended");

    if (active) {
      await ctx.db.patch(active._id, {
        status: "active",
        updatedAt: Date.now(),
      });
      return active._id;
    }

    return ctx.db.insert("dmCallSessions", {
      conversationId: args.conversationId,
      startedBy: args.actorUserId,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      endedAt: undefined,
    });
  },
});
