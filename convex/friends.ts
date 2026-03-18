import { v } from "convex/values";
import { normalizePairKey } from "../shared/permissions";
import type { Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";

type DbCtx = MutationCtx | QueryCtx;
const isPresent = <T>(value: T | null): value is T => value !== null;

const getFriendshipsForUser = async (ctx: DbCtx, userId: Id<"users">) => {
  const [left, right] = await Promise.all([
    ctx.db
      .query("friendships")
      .withIndex("by_userAId", (query) => query.eq("userAId", userId))
      .collect(),
    ctx.db
      .query("friendships")
      .withIndex("by_userBId", (query) => query.eq("userBId", userId))
      .collect(),
  ]);

  return [...left, ...right];
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireCurrentUser(ctx);
    const [friendships, incoming, outgoing] = await Promise.all([
      getFriendshipsForUser(ctx, user._id),
      ctx.db
        .query("friendRequests")
        .withIndex("by_toUserId", (query) => query.eq("toUserId", user._id))
        .collect(),
      ctx.db
        .query("friendRequests")
        .withIndex("by_fromUserId", (query) => query.eq("fromUserId", user._id))
        .collect(),
    ]);

    const friendIds = friendships.map((friendship) =>
      friendship.userAId === user._id ? friendship.userBId : friendship.userAId
    );
    const uniqueFriendIds = Array.from(new Set(friendIds));
    const friends = await Promise.all(
      uniqueFriendIds.map((friendId) => ctx.db.get(friendId))
    );

    return {
      friends: friends.filter(isPresent).map((friend) => ({
        _id: friend._id,
        handle: friend.handle,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl ?? null,
      })),
      incoming: await Promise.all(
        incoming
          .filter((request) => request.status === "pending")
          .map(async (request) => ({
            ...request,
            fromUser: await ctx.db.get(request.fromUserId),
          }))
      ),
      outgoing: await Promise.all(
        outgoing
          .filter((request) => request.status === "pending")
          .map(async (request) => ({
            ...request,
            toUser: await ctx.db.get(request.toUserId),
          }))
      ),
    };
  },
});

export const sendRequest = mutation({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const target = await ctx.db
      .query("users")
      .withIndex("by_handle", (query) =>
        query.eq("handle", args.handle.toLowerCase())
      )
      .unique();

    if (!target) {
      throw new Error("That user does not exist.");
    }

    if (target._id === user._id) {
      throw new Error("You cannot add yourself.");
    }

    const pairKey = normalizePairKey(user._id, target._id);
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_pairKey", (query) => query.eq("pairKey", pairKey))
      .unique();
    if (existingFriendship) {
      throw new Error("You are already friends.");
    }

    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_pair", (query) =>
        query.eq("fromUserId", user._id).eq("toUserId", target._id)
      )
      .unique();

    if (existingRequest?.status === "pending") {
      throw new Error("Friend request already sent.");
    }

    return ctx.db.insert("friendRequests", {
      fromUserId: user._id,
      toUserId: target._id,
      createdAt: Date.now(),
      status: "pending",
    });
  },
});

export const respondToRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const request = await ctx.db.get(args.requestId);

    if (!request || request.toUserId !== user._id) {
      throw new Error("Request not found.");
    }

    if (request.status !== "pending") {
      throw new Error("Request is no longer active.");
    }

    await ctx.db.patch(request._id, {
      status: args.accept ? "accepted" : "declined",
    });

    if (args.accept) {
      const pairKey = normalizePairKey(request.fromUserId, request.toUserId);
      const friendshipId = await ctx.db.insert("friendships", {
        userAId:
          request.fromUserId < request.toUserId
            ? request.fromUserId
            : request.toUserId,
        userBId:
          request.fromUserId < request.toUserId
            ? request.toUserId
            : request.fromUserId,
        pairKey,
        createdAt: Date.now(),
      });

      const existingConversation = await ctx.db
        .query("conversations")
        .withIndex("by_pairKey", (query) => query.eq("pairKey", pairKey))
        .unique();

      if (!existingConversation) {
        await ctx.db.insert("conversations", {
          kind: "dm",
          participantIds: [request.fromUserId, request.toUserId].sort(),
          participantAId:
            request.fromUserId < request.toUserId
              ? request.fromUserId
              : request.toUserId,
          participantBId:
            request.fromUserId < request.toUserId
              ? request.toUserId
              : request.fromUserId,
          pairKey,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return friendshipId;
    }

    return null;
  },
});

export const removeFriend = mutation({
  args: {
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCurrentUser(ctx);
    const pairKey = normalizePairKey(user._id, args.friendId);
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_pairKey", (query) => query.eq("pairKey", pairKey))
      .unique();

    if (!friendship) {
      throw new Error("Friendship not found.");
    }

    await ctx.db.delete(friendship._id);
  },
});
