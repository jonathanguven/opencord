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
import { cn } from "@/lib/utils";

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
      filterRequests(view.friends, "incoming", normalizedQuery).sort((a, b) =>
        getDisplayName(a.fromUser).localeCompare(getDisplayName(b.fromUser))
      ),
    [normalizedQuery, view.friends]
  );

  const filteredOutgoing = useMemo(
    () =>
      filterRequests(view.friends, "outgoing", normalizedQuery).sort((a, b) =>
        getDisplayName(a.toUser).localeCompare(getDisplayName(b.toUser))
      ),
    [normalizedQuery, view.friends]
  );

  return (
    <Tabs
      className="flex h-full flex-col bg-[#313338]"
      onValueChange={friends.setFriendsTab}
      value={friends.friendsTab}
    >
      <header className="border-white/6 border-b bg-[#313338] px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-[#f2f3f5]">
            <UsersIcon className="size-4 text-[#b5bac1]" />
            <span>Friends</span>
          </div>
          <span className="text-[#4e5058]">|</span>
          <TabsList className="h-auto gap-2 p-0" variant="line">
            <FriendsTab
              className={
                friends.friendsTab === "all"
                  ? "bg-[#404249] text-white hover:bg-[#404249] hover:text-white"
                  : "bg-transparent text-[#b5bac1] hover:bg-[#35373c] hover:text-white"
              }
              value="all"
            >
              All
            </FriendsTab>
            <FriendsTab
              className={
                friends.friendsTab === "pending"
                  ? "bg-[#404249] text-white hover:bg-[#404249] hover:text-white"
                  : "bg-transparent text-[#b5bac1] hover:bg-[#35373c] hover:text-white"
              }
              value="pending"
            >
              Pending
            </FriendsTab>
            <FriendsTab
              className={
                friends.friendsTab === "add"
                  ? "bg-[#2b2d31] text-[#949cf7] hover:bg-[#2b2d31] hover:text-[#949cf7]"
                  : "bg-[#5865f2] text-white hover:bg-[#4752c4] hover:text-white active:bg-[#4752c4]"
              }
              value="add"
            >
              Add Friend
            </FriendsTab>
          </TabsList>
        </div>
      </header>

      <TabsContent className="min-h-0 flex-1" value="all">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-white/6 border-b px-6 py-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8e9297]" />
              <Input
                className="h-10 rounded-lg border-white/6 bg-[#1e1f22] pr-4 pl-11 text-[#f2f3f5] placeholder:text-[#8e9297] focus-visible:border-[#5865f2] focus-visible:ring-[#5865f2]/20"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                value={searchQuery}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <section className="pt-4">
              <div className="mb-3 font-semibold text-[#f2f3f5] text-xs uppercase tracking-[0.04em]">
                All friends - {filteredFriends.length}
              </div>
              {filteredFriends.length ? (
                <div className="border-white/6 border-t">
                  {filteredFriends.map((friend) => (
                    <FriendRow
                      friend={friend}
                      key={friend._id}
                      onMessage={() => navigation.openConversation(friend._id)}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border border-white/6 bg-[#2b2d31] text-[#dcddde]">
                  <EmptyHeader>
                    <EmptyMedia
                      className="border-white/6 bg-[#1e1f22]"
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
                      className="bg-[#5865f2] text-white hover:bg-[#6d78f6]"
                      onClick={() => friends.setFriendsTab("add")}
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
          <div className="border-white/6 border-b px-6 py-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8e9297]" />
              <Input
                className="h-10 rounded-lg border-white/6 bg-[#1e1f22] pr-4 pl-11 text-[#f2f3f5] placeholder:text-[#8e9297] focus-visible:border-[#5865f2] focus-visible:ring-[#5865f2]/20"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pending requests"
                value={searchQuery}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <section className="pt-4">
              <div className="mb-3 font-semibold text-[#f2f3f5] text-xs uppercase tracking-[0.04em]">
                Incoming - {filteredIncoming.length}
              </div>
              {filteredIncoming.length ? (
                <div className="border-white/6 border-t">
                  {filteredIncoming.map((request) => (
                    <RequestRow
                      actions={
                        <>
                          <Button
                            className="size-9 rounded-full border border-emerald-400/20 bg-emerald-500/12 p-0 text-emerald-300 hover:bg-emerald-500/18 hover:text-emerald-200"
                            onClick={() =>
                              friends.acceptFriendRequest(request._id)
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            <CheckIcon className="size-4" />
                          </Button>
                          <Button
                            className="size-9 rounded-full border border-rose-400/20 bg-rose-500/12 p-0 text-rose-300 hover:bg-rose-500/18 hover:text-rose-200"
                            onClick={() =>
                              friends.declineFriendRequest(request._id)
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            <XIcon className="size-4" />
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
                <Empty className="border border-white/6 bg-[#2b2d31] text-[#dcddde]">
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
              <div className="mb-3 font-semibold text-[#f2f3f5] text-xs uppercase tracking-[0.04em]">
                Outgoing - {filteredOutgoing.length}
              </div>
              {filteredOutgoing.length ? (
                <div className="border-white/6 border-t">
                  {filteredOutgoing.map((request) => (
                    <RequestRow
                      actions={
                        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-[#232428] px-3 py-1.5 text-[#b5bac1] text-xs">
                          <Clock3Icon className="size-3.5" />
                          Pending
                        </div>
                      }
                      key={request._id}
                      status="Outgoing friend request"
                      user={request.toUser}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border border-white/6 bg-[#2b2d31] text-[#dcddde]">
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
          <div className="border-white/6 border-b px-6 py-5">
            <div className="max-w-3xl">
              <h2 className="font-bold text-[#f2f3f5] text-lg uppercase tracking-[0.02em]">
                Add Friend
              </h2>
              <p className="mt-1 text-[#b5bac1] text-sm">
                Add friends with their Opencord handle. It is case sensitive.
              </p>
            </div>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={friends.submitFriendRequest}
            >
              <div className="flex h-12 items-center rounded-lg border border-[#3f4147] bg-[#1e1f22] pr-2 pl-4">
                <span className="mr-2 shrink-0 text-[#8e9297]">@</span>
                <Input
                  aria-label="Friend handle"
                  className="h-full border-0 bg-transparent px-0 text-[#f2f3f5] shadow-none focus-visible:ring-0"
                  id="friend-handle-inline"
                  onChange={(event) =>
                    friends.setFriendHandleDraft(event.target.value)
                  }
                  placeholder="You can add friends with their Opencord username."
                  value={friends.friendHandleDraft}
                />
                <Button
                  className="rounded-md bg-[#5865f2] px-4 text-white hover:bg-[#6d78f6]"
                  disabled={!friends.friendHandleDraft.trim()}
                  type="submit"
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
  className,
  value,
}: {
  children: ReactNode;
  className?: string;
  value: string;
}) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 font-medium transition-colors",
        className
      )}
      value={value}
    >
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
    <div className="flex items-center gap-3 border-white/6 border-b py-3 transition-colors hover:bg-white/[0.02]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={friend.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-[#5865f2]/20 text-white">
            {getInitials(getDisplayName(friend))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-semibold text-[#f2f3f5]">
            {getDisplayName(friend)}
          </div>
          <div className="truncate text-[#b5bac1] text-sm">Offline</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            onClick={onMessage}
            render={
              <Button
                className="size-9 rounded-full bg-[#232428] p-0 text-[#b5bac1] hover:bg-[#2c2d31] hover:text-white"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <MessageSquareIcon className="size-4" />
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
    <div className="flex items-center gap-3 border-white/6 border-b py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={user?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-[#5865f2]/20 text-white">
            {getInitials(getDisplayName(user))}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate font-semibold text-[#f2f3f5]">
            {getDisplayName(user)}
          </div>
          <div className="truncate text-[#b5bac1] text-sm">{status}</div>
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

function filterRequests(
  friends: FriendsResult | undefined,
  kind: "incoming" | "outgoing",
  normalizedQuery: string
) {
  const requests = friends?.[kind] ?? [];

  if (!normalizedQuery) {
    return requests;
  }

  return requests.filter((request) =>
    kind === "incoming"
      ? matchesUser(request.fromUser, normalizedQuery)
      : matchesUser(request.toUser, normalizedQuery)
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
