import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import {
  CheckIcon,
  Clock3Icon,
  MessageSquareIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useWorkspaceFriends,
  useWorkspaceNavigation,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import type {
  FriendLite,
  FriendsResult,
} from "@/components/workspace/workspace-types";
import { getDisplayName, getInitials } from "@/lib/presentation";

const friendsTabClassName =
  "inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active]:bg-secondary data-[active]:text-secondary-foreground disabled:cursor-not-allowed aria-disabled:cursor-not-allowed";

const searchInputClassName =
  "h-10 bg-input/30 pr-4 pl-11 shadow-none placeholder:text-muted-foreground dark:bg-input/30";

const sectionLabelClassName =
  "mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-[0.04em]";

type IncomingRequest = FriendsResult["incoming"][number];
type OutgoingRequest = FriendsResult["outgoing"][number];

export function FriendsHome() {
  const view = useWorkspaceView();
  const friends = useWorkspaceFriends();
  const navigation = useWorkspaceNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFriends = useMemo(
    () =>
      filterUsers(view.friends?.friends ?? [], normalizedQuery).sort((a, b) =>
        getDisplayName(a).localeCompare(getDisplayName(b))
      ),
    [normalizedQuery, view.friends?.friends]
  );

  const filteredIncoming = useMemo(
    () =>
      filterIncomingRequests(view.friends, normalizedQuery).sort((a, b) =>
        getDisplayName(a.fromUser).localeCompare(getDisplayName(b.fromUser))
      ),
    [normalizedQuery, view.friends]
  );

  const filteredOutgoing = useMemo(
    () =>
      filterOutgoingRequests(view.friends, normalizedQuery).sort((a, b) =>
        getDisplayName(a.toUser).localeCompare(getDisplayName(b.toUser))
      ),
    [normalizedQuery, view.friends]
  );

  return (
    <Tabs
      className="flex h-full flex-col bg-background"
      onValueChange={friends.setFriendsTab}
      value={friends.friendsTab}
    >
      <header className="border-b bg-background px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <UsersIcon className="size-4 text-muted-foreground" />
            <span>Friends</span>
          </div>
          <span className="text-border">|</span>
          <TabsList className="h-auto gap-2 p-0" variant="line">
            <FriendsTab value="all">All</FriendsTab>
            <FriendsTab value="pending">Pending</FriendsTab>
            <FriendsTab value="add">Add Friend</FriendsTab>
          </TabsList>
        </div>
      </header>

      <TabsContent className="min-h-0 flex-1" value="all">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b px-6 py-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={searchInputClassName}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                value={searchQuery}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <section className="pt-4">
              <div className={sectionLabelClassName}>
                All friends - {filteredFriends.length}
              </div>
              {filteredFriends.length ? (
                <div className="border-t">
                  {filteredFriends.map((friend) => (
                    <FriendRow
                      friend={friend}
                      key={friend._id}
                      onMessage={() => navigation.openConversation(friend._id)}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border bg-card text-foreground">
                  <EmptyHeader>
                    <EmptyMedia
                      className="bg-muted text-muted-foreground"
                      variant="icon"
                    >
                      <UsersIcon />
                    </EmptyMedia>
                    <EmptyTitle>No friends found</EmptyTitle>
                    <EmptyDescription>
                      {normalizedQuery
                        ? "Try a different search term."
                        : "Add your crew to unlock DMs and private calls."}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      onClick={() => friends.setFriendsTab("add")}
                      variant="friend"
                    >
                      <UserPlusIcon data-icon="inline-start" />
                      Add Friend
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </section>
          </div>
        </div>
      </TabsContent>

      <TabsContent className="min-h-0 flex-1" value="pending">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b px-6 py-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className={searchInputClassName}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pending requests"
                value={searchQuery}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <section className="pt-4">
              <div className={sectionLabelClassName}>
                Incoming - {filteredIncoming.length}
              </div>
              {filteredIncoming.length ? (
                <div className="border-t">
                  {filteredIncoming.map((request) => (
                    <RequestRow
                      actions={
                        <>
                          <Button
                            className="rounded-full"
                            onClick={() =>
                              friends.acceptFriendRequest(request._id)
                            }
                            size="icon-sm"
                            variant="secondary"
                          >
                            <CheckIcon />
                          </Button>
                          <Button
                            className="rounded-full"
                            onClick={() =>
                              friends.declineFriendRequest(request._id)
                            }
                            size="icon-sm"
                            variant="destructive"
                          >
                            <XIcon />
                          </Button>
                        </>
                      }
                      key={request._id}
                      status="Incoming friend request"
                      user={request.fromUser}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border bg-card text-foreground">
                  <EmptyHeader>
                    <EmptyTitle>No incoming requests</EmptyTitle>
                    <EmptyDescription>
                      {normalizedQuery
                        ? "Nothing matches that search."
                        : "You are caught up for now."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>

            <section className="pt-8">
              <div className={sectionLabelClassName}>
                Outgoing - {filteredOutgoing.length}
              </div>
              {filteredOutgoing.length ? (
                <div className="border-t">
                  {filteredOutgoing.map((request) => (
                    <RequestRow
                      actions={
                        <Badge
                          className="rounded-full px-3 py-1"
                          variant="secondary"
                        >
                          <Clock3Icon data-icon="inline-start" />
                          Pending
                        </Badge>
                      }
                      key={request._id}
                      status="Outgoing friend request"
                      user={request.toUser}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border bg-card text-foreground">
                  <EmptyHeader>
                    <EmptyTitle>No outgoing requests</EmptyTitle>
                    <EmptyDescription>
                      {normalizedQuery
                        ? "Nothing matches that search."
                        : "Invite more people into your private network."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>
          </div>
        </div>
      </TabsContent>

      <TabsContent className="min-h-0 flex-1" value="add">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b px-6 py-5">
            <div className="max-w-3xl">
              <h2 className="font-bold text-foreground text-lg uppercase tracking-[0.02em]">
                Add Friend
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Add friends with their Opencord handle. It is case sensitive.
              </p>
            </div>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={friends.submitFriendRequest}
            >
              <div className="flex h-12 items-center rounded-lg border bg-input/30 pr-2 pl-4">
                <span className="mr-2 shrink-0 text-muted-foreground">@</span>
                <Input
                  aria-label="Friend handle"
                  className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                  id="friend-handle-inline"
                  onChange={(event) =>
                    friends.setFriendHandleDraft(event.target.value)
                  }
                  placeholder="You can add friends with their Opencord username."
                  value={friends.friendHandleDraft}
                />
                <Button
                  className="disabled:pointer-events-auto disabled:cursor-not-allowed"
                  disabled={!friends.friendHandleDraft.trim()}
                  type="submit"
                  variant="friend"
                >
                  Send Friend Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function FriendsTab({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) {
  return (
    <TabsPrimitive.Tab className={friendsTabClassName} value={value}>
      {children}
    </TabsPrimitive.Tab>
  );
}

function FriendRow({
  friend,
  onMessage,
}: {
  friend: FriendLite;
  onMessage: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b py-3 transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={friend.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/15 text-primary">
            {getInitials(getDisplayName(friend))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">
            {getDisplayName(friend)}
          </div>
          <div className="truncate text-muted-foreground text-sm">Offline</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            onClick={onMessage}
            render={
              <Button
                className="rounded-full"
                size="icon-sm"
                variant="secondary"
              />
            }
          >
            <MessageSquareIcon />
          </TooltipTrigger>
          <TooltipContent>message</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function RequestRow({
  actions,
  status,
  user,
}: {
  actions: ReactNode;
  status: string;
  user: FriendLite | null | undefined;
}) {
  return (
    <div className="flex items-center gap-3 border-b py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={user?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/15 text-primary">
            {getInitials(getDisplayName(user))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">
            {getDisplayName(user)}
          </div>
          <div className="truncate text-muted-foreground text-sm">{status}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

function filterUsers(users: FriendLite[], normalizedQuery: string) {
  if (!normalizedQuery) {
    return users;
  }

  return users.filter((user) => matchesUser(user, normalizedQuery));
}

function filterIncomingRequests(
  friends: FriendsResult | undefined,
  normalizedQuery: string
) {
  const requests: IncomingRequest[] = friends?.incoming ?? [];

  if (!normalizedQuery) {
    return requests;
  }

  return requests.filter((request) =>
    matchesUser(request.fromUser, normalizedQuery)
  );
}

function filterOutgoingRequests(
  friends: FriendsResult | undefined,
  normalizedQuery: string
) {
  const requests: OutgoingRequest[] = friends?.outgoing ?? [];

  if (!normalizedQuery) {
    return requests;
  }

  return requests.filter((request) =>
    matchesUser(request.toUser, normalizedQuery)
  );
}

function matchesUser(
  user: FriendLite | null | undefined,
  normalizedQuery: string
) {
  const displayName = getDisplayName(user).toLowerCase();
  const handle = user?.handle?.toLowerCase() ?? "";

  return (
    displayName.includes(normalizedQuery) || handle.includes(normalizedQuery)
  );
}
