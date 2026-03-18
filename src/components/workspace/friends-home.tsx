import { CheckIcon, UserPlusIcon, UsersIcon, XIcon } from "lucide-react";
import type { FormEvent } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDisplayName, getInitials } from "@/lib/presentation";
import type { Id } from "../../../convex/_generated/dataModel";
import type { FriendsResult } from "./workspace-types";

interface FriendsHomeProps {
  friendHandleDraft: string;
  friends: FriendsResult | undefined;
  onAcceptRequest: (requestId: Id<"friendRequests">) => void;
  onDeclineRequest: (requestId: Id<"friendRequests">) => void;
  onFriendHandleChange: (value: string) => void;
  onMessageFriend: (friendId: Id<"users">) => void;
  onRemoveFriend: (friendId: Id<"users">) => void;
  onSubmitFriendRequest: (event: FormEvent<HTMLFormElement>) => void;
  onTabChange: (value: string) => void;
  selectedTab: string;
}

export function FriendsHome({
  friendHandleDraft,
  friends,
  onAcceptRequest,
  onDeclineRequest,
  onFriendHandleChange,
  onMessageFriend,
  onRemoveFriend,
  onSubmitFriendRequest,
  onTabChange,
  selectedTab,
}: FriendsHomeProps) {
  return (
    <Tabs
      className="flex h-full flex-col"
      onValueChange={onTabChange}
      value={selectedTab}
    >
      <div className="border-border/60 border-b px-4 py-3">
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="add">Add friend</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent className="min-h-0 flex-1 p-4" value="all">
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle>Friends</CardTitle>
            <CardDescription>
              People you can message instantly and call 1:1.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 py-4">
            {friends?.friends.length ? (
              friends.friends.map((friend) => (
                <div
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                  key={friend._id}
                >
                  <Avatar>
                    <AvatarImage src={friend.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {getInitials(getDisplayName(friend))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {getDisplayName(friend)}
                    </div>
                    <div className="truncate text-muted-foreground text-xs">
                      @{friend.handle ?? "unknown"}
                    </div>
                  </div>
                  <Button
                    onClick={() => onMessageFriend(friend._id)}
                    variant="secondary"
                  >
                    Message
                  </Button>
                  <Button
                    onClick={() => onRemoveFriend(friend._id)}
                    variant="outline"
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <Empty className="flex-1 border-border/60 bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>No friends yet</EmptyTitle>
                  <EmptyDescription>
                    Add your crew to unlock DMs and private calls.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => onTabChange("add")}>
                    <UserPlusIcon data-icon="inline-start" />
                    Add your first friend
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent className="min-h-0 flex-1 p-4" value="pending">
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>
              Incoming and outgoing requests update live.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 py-4">
            <section className="flex flex-col gap-3">
              <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Incoming
              </div>
              {friends?.incoming.length ? (
                friends.incoming.map((request) => (
                  <div
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                    key={request._id}
                  >
                    <Avatar>
                      <AvatarImage
                        src={request.fromUser?.avatarUrl ?? undefined}
                      />
                      <AvatarFallback>
                        {getInitials(getDisplayName(request.fromUser))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {getDisplayName(request.fromUser)}
                      </div>
                      <div className="truncate text-muted-foreground text-xs">
                        @{request.fromUser?.handle ?? "unknown"}
                      </div>
                    </div>
                    <Button onClick={() => onAcceptRequest(request._id)}>
                      <CheckIcon data-icon="inline-start" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => onDeclineRequest(request._id)}
                      variant="outline"
                    >
                      <XIcon data-icon="inline-start" />
                      Decline
                    </Button>
                  </div>
                ))
              ) : (
                <Empty className="border-border/60 bg-muted/20">
                  <EmptyHeader>
                    <EmptyTitle>No incoming requests</EmptyTitle>
                    <EmptyDescription>
                      You are caught up for now.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Outgoing
              </div>
              {friends?.outgoing.length ? (
                friends.outgoing.map((request) => (
                  <div
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                    key={request._id}
                  >
                    <Avatar>
                      <AvatarImage
                        src={request.toUser?.avatarUrl ?? undefined}
                      />
                      <AvatarFallback>
                        {getInitials(getDisplayName(request.toUser))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {getDisplayName(request.toUser)}
                      </div>
                      <div className="truncate text-muted-foreground text-xs">
                        @{request.toUser?.handle ?? "unknown"}
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))
              ) : (
                <Empty className="border-border/60 bg-muted/20">
                  <EmptyHeader>
                    <EmptyTitle>No outgoing requests</EmptyTitle>
                    <EmptyDescription>
                      Invite more people into your private network.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent className="min-h-0 flex-1 p-4" value="add">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
          <section className="border-border/60 border-b p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <h2 className="font-semibold text-3xl tracking-tight">
                  Add Friend
                </h2>
                <p className="text-base text-muted-foreground">
                  Add friends with their Opencord handle and start a private DM
                  when they accept.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-right">
                <div className="font-medium text-primary text-xs uppercase tracking-[0.2em]">
                  Direct network
                </div>
                <div className="mt-1 text-muted-foreground text-sm">
                  Invite-only by design
                </div>
              </div>
            </div>

            <form
              className="mt-6 flex flex-col gap-3"
              onSubmit={onSubmitFriendRequest}
            >
              <InputGroup className="h-18 rounded-2xl border-border/70 bg-background/60 px-3">
                <InputGroupAddon align="inline-start">
                  <InputGroupText>@</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  aria-label="Friend handle"
                  className="text-base"
                  id="friend-handle-inline"
                  onChange={(event) => onFriendHandleChange(event.target.value)}
                  placeholder="Add a friend with their handle"
                  value={friendHandleDraft}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    className="h-11 rounded-xl px-5"
                    disabled={!friendHandleDraft.trim()}
                    size="sm"
                    type="submit"
                    variant="default"
                  >
                    Send Friend Request
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <p className="text-muted-foreground text-sm">
                Handles are exact. Ask your friend to share theirs directly if
                you do not have it yet.
              </p>
            </form>
          </section>

          <section className="flex-1 p-6">
            <div className="max-w-4xl space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-2xl tracking-tight">
                  Other Places to Make Friends
                </h3>
                <p className="text-base text-muted-foreground">
                  Opencord keeps discovery private. Join shared servers through
                  invites, then swap handles directly.
                </p>
              </div>

              <Card className="max-w-2xl border-border/70 bg-background/40">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                      <UsersIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium">Invite-only communities</div>
                      <div className="text-muted-foreground text-sm">
                        Ask for a server invite or share your handle with people
                        you trust.
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">No public discovery</Badge>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </TabsContent>
    </Tabs>
  );
}
