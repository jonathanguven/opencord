import {
  ChevronDownIcon,
  CopyIcon,
  HashIcon,
  HeadphonesIcon,
  LogOutIcon,
  MessageSquareIcon,
  MicIcon,
  PlusIcon,
  Settings2Icon,
  UserPlusIcon,
  UsersIcon,
  Volume2Icon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceCommandPalette } from "@/components/workspace/workspace-command-palette";
import {
  useWorkspaceFriends,
  useWorkspaceNavigation,
  useWorkspaceUi,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import type { VoicePresenceItem } from "@/components/workspace/workspace-types";
import { getDisplayName, getInitials } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import { getChannelPath, getDmPath, getServerPath } from "@/lib/workspace";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const SIDEBAR_RAIL_TONES = [
  "from-sky-500 to-cyan-400",
  "from-fuchsia-500 to-pink-500",
  "from-emerald-500 to-lime-400",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-indigo-500",
  "from-rose-500 to-red-500",
] as const;

const railButtonClassName =
  "size-12 rounded-[1.35rem] border border-sidebar-border bg-sidebar text-sidebar-foreground transition-all hover:bg-accent hover:text-accent-foreground";

const listItemClassName =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors";

interface DiscordDmRowProps {
  active?: boolean;
  avatarUrl?: string | null;
  displayName: string;
  onClick: () => void;
  presence?: "active" | "idle";
  subtitle: string;
}

export function WorkspaceRail() {
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const navigation = useWorkspaceNavigation();

  return (
    <div className="flex w-[76px] shrink-0 flex-col items-center justify-between border-sidebar-border border-r bg-popover px-3 py-3">
      <div className="flex w-full flex-col items-center">
        <div className="flex h-16 w-full flex-col items-center justify-start gap-3 border-sidebar-border border-b pb-3">
          <Tooltip>
            <TooltipTrigger
              onClick={() => navigation.navigate("/channels")}
              render={
                <Button
                  className={cn(
                    railButtonClassName,
                    "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_10px_30px_rgb(88_101_242_/_0.28)] hover:bg-[var(--friend-action-hover)]",
                    view.isFriendsView &&
                      "rounded-[1rem] bg-foreground text-popover hover:bg-foreground"
                  )}
                  size="icon-lg"
                  variant="ghost"
                />
              }
            >
              <MessageSquareIcon />
            </TooltipTrigger>
            <TooltipContent side="right">Friends & DMs</TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="max-h-[calc(100svh-11rem)]">
          <div className="flex flex-col items-center gap-3 pt-3">
            {view.servers?.map((entry, index) => {
              if (!entry.server) {
                return null;
              }

              const server = entry.server;
              const isActive = view.activeServerId === server._id;

              return (
                <Tooltip key={server._id}>
                  <TooltipTrigger
                    onClick={() =>
                      navigation.navigate(getServerPath(server._id))
                    }
                    render={
                      <Button
                        className={cn(
                          railButtonClassName,
                          isActive &&
                            "rounded-[1rem] bg-foreground text-popover"
                        )}
                        size="icon-lg"
                        variant="ghost"
                      />
                    }
                  >
                    <span
                      className={cn(
                        "inline-flex size-full items-center justify-center rounded-[1.15rem] bg-linear-to-br font-semibold",
                        SIDEBAR_RAIL_TONES[index % SIDEBAR_RAIL_TONES.length]
                      )}
                    >
                      {getInitials(server.name)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right">{server.name}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </ScrollArea>

        <Tooltip>
          <TooltipTrigger
            onClick={() => ui.setIsCreateServerOpen(true)}
            render={
              <Button
                className={railButtonClassName}
                size="icon-lg"
                variant="ghost"
              />
            }
          >
            <PlusIcon />
          </TooltipTrigger>
          <TooltipContent side="right">Create server</TooltipContent>
        </Tooltip>
      </div>

      <div className="size-12 rounded-[1.35rem] border border-sidebar-border bg-sidebar" />
    </div>
  );
}

export function WorkspaceSidebar() {
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const navigation = useWorkspaceNavigation();
  const friends = useWorkspaceFriends();
  const isFriendsHomeActive = view.isFriendsView && !view.activeConversationId;

  const currentUser = view.current?.user;
  const sidebarProfileName = getDisplayName(currentUser);
  const sidebarProfileHandle = `@${currentUser?.handle ?? "finish-setup"}`;
  const directMessageCount = view.conversations?.length ?? 0;

  return (
    <aside className="flex h-full flex-col border-sidebar-border border-r bg-sidebar text-sidebar-foreground">
      {view.isFriendsView ? (
        <div className="border-sidebar-border border-b p-3">
          <WorkspaceCommandPalette />
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {view.isFriendsView ? (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-3">
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold text-[0.95rem] transition-colors",
                  isFriendsHomeActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => {
                  navigation.navigate("/channels");
                  friends.setFriendsTab("all");
                }}
                type="button"
              >
                <UsersIcon className="size-5 shrink-0" />
                <span className="truncate">Friends</span>
              </button>

              <div className="mt-3 flex items-center justify-between px-2">
                <div className="font-semibold text-muted-foreground text-sm">
                  Direct Messages
                </div>
                <button
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={navigation.showAddFriendTab}
                  type="button"
                >
                  <PlusIcon className="size-4" />
                  <span className="sr-only">Add friend</span>
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {view.conversations?.map((conversation) => (
                  <DiscordDmRow
                    active={view.activeConversationId === conversation._id}
                    avatarUrl={conversation.otherUser?.avatarUrl}
                    displayName={getDisplayName(conversation.otherUser)}
                    key={conversation._id}
                    onClick={() =>
                      navigation.navigate(getDmPath(conversation._id))
                    }
                    presence={conversation.activeCall ? "active" : "idle"}
                    subtitle={
                      conversation.latestMessage?.body ?? "Start chatting"
                    }
                  />
                ))}

                {view.conversations?.length ? null : (
                  <Empty className="mt-2 border border-sidebar-border bg-accent/60 text-foreground">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MessageSquareIcon />
                      </EmptyMedia>
                      <EmptyTitle>No DMs yet</EmptyTitle>
                      <EmptyDescription>
                        Add a friend to open your first private conversation.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-3">
              <div className="rounded-2xl border border-sidebar-border bg-accent/60 p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-foreground text-lg">
                      {view.activeServer?.name ?? "Server"}
                    </div>
                    <div className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                      {view.activeServer?.description ||
                        "Flat channels, invite-only access, and reactive voice presence."}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          className="rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
                          size="icon-sm"
                          variant="ghost"
                        />
                      }
                    >
                      <Settings2Icon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Server actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => ui.setIsInviteOpen(true)}
                        >
                          <CopyIcon />
                          Create invite
                        </DropdownMenuItem>
                        {view.permissions.manageChannels ||
                        view.permissions.admin ? (
                          <DropdownMenuItem
                            onClick={() => ui.setIsCreateChannelOpen(true)}
                          >
                            <PlusIcon />
                            New channel
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <ChannelSection
                activeChannelId={view.routeChannelId}
                channels={view.textChannels}
                icon={HashIcon}
                label="Text channels"
                onSelect={(channelId) => {
                  if (!view.activeServerId) {
                    return;
                  }

                  navigation.navigate(
                    getChannelPath(view.activeServerId, channelId)
                  );
                }}
              />

              <ChannelSection
                activeChannelId={view.routeChannelId}
                channels={view.voiceChannels}
                counts={view.voicePresence}
                icon={Volume2Icon}
                label="Voice channels"
                onSelect={(channelId) => {
                  if (!view.activeServerId) {
                    return;
                  }

                  navigation.navigate(
                    getChannelPath(view.activeServerId, channelId)
                  );
                }}
              />
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="border-sidebar-border border-t p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-accent px-3 py-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05)]">
          <Avatar className="size-11">
            <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {getInitials(sidebarProfileName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-foreground text-lg">
              {sidebarProfileName}
            </div>
            <div className="truncate text-muted-foreground text-sm">
              {sidebarProfileHandle}
            </div>
            <div className="truncate text-muted-foreground/90 text-sm">
              {view.isFriendsView
                ? `${directMessageCount} open DMs`
                : (view.activeServer?.name ?? "OpenCord")}
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="rounded-lg p-1.5 transition-colors hover:bg-background/40 hover:text-foreground">
              <MicIcon className="size-5" />
            </span>
            <span className="rounded-lg p-1.5 transition-colors hover:bg-background/40 hover:text-foreground">
              <HeadphonesIcon className="size-5" />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-background/40 hover:text-foreground"
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <Settings2Icon className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuLabel>
                  {sidebarProfileName}
                  <div className="font-normal text-muted-foreground text-xs">
                    {sidebarProfileHandle}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={navigation.showAddFriendTab}>
                    <UserPlusIcon />
                    Add friend
                  </DropdownMenuItem>
                  {view.canCreateServerInvites ? (
                    <DropdownMenuItem onClick={() => ui.setIsInviteOpen(true)}>
                      <CopyIcon />
                      Create invite
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={navigation.handleSignOut}>
                    <LogOutIcon />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function DiscordDmRow({
  active = false,
  avatarUrl,
  displayName,
  presence = "idle",
  subtitle,
  onClick,
}: DiscordDmRowProps) {
  return (
    <button
      className={cn(
        listItemClassName,
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      onClick={onClick}
      type="button"
    >
      <div className="relative shrink-0">
        <Avatar className="size-10">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute right-0 bottom-0 size-3 rounded-full border-2 border-sidebar",
            presence === "active" ? "bg-emerald-400" : "bg-muted-foreground"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[0.98rem]">
          {displayName}
        </div>
        <div className="truncate text-muted-foreground text-xs">{subtitle}</div>
      </div>
    </button>
  );
}

function ChannelSection({
  activeChannelId,
  channels,
  counts,
  icon: Icon,
  label,
  onSelect,
}: {
  activeChannelId: Id<"channels"> | null;
  channels: Doc<"channels">[];
  counts?: VoicePresenceItem[];
  icon: typeof HashIcon;
  label: string;
  onSelect: (channelId: Id<"channels">) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-2 font-black text-muted-foreground text-xs uppercase tracking-[0.16em]">
        {label}
      </div>
      {channels.length ? (
        channels.map((channel) => {
          const count =
            counts?.filter((entry) => entry.channelId === channel._id).length ??
            0;
          let trailingContent: ReactNode = null;

          if (typeof counts === "undefined") {
            if (channel.access === "private") {
              trailingContent = (
                <span className="rounded-full border border-sidebar-border px-2 py-0.5 font-bold text-[0.68rem] text-muted-foreground">
                  Private
                </span>
              );
            }
          } else {
            trailingContent = (
              <span className="rounded-full bg-background/70 px-2 py-0.5 font-bold text-[0.7rem] text-foreground">
                {count}
              </span>
            );
          }

          return (
            <button
              className={cn(
                listItemClassName,
                activeChannelId === channel._id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              key={channel._id}
              onClick={() => onSelect(channel._id)}
              type="button"
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate font-semibold text-[0.95rem]">
                {channel.kind === "text" ? `# ${channel.name}` : channel.name}
              </span>
              <div className="shrink-0">{trailingContent}</div>
            </button>
          );
        })
      ) : (
        <Empty className="border border-sidebar-border bg-accent/60 p-4 text-foreground">
          <EmptyHeader>
            <EmptyTitle>No channels</EmptyTitle>
            <EmptyDescription>
              Create one to start the server loop.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
