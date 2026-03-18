import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ChevronDownIcon,
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
import { type ReactNode, useEffect, useState } from "react";

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
  useWorkspaceDialogs,
  useWorkspaceFriends,
  useWorkspaceNavigation,
  useWorkspaceUi,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import type { VoicePresenceItem } from "@/components/workspace/workspace-types";
import { getChannelNameText } from "@/lib/channel-name";
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
  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors";

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
                    "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_10px_30px_rgb(88_101_242/0.28)] hover:bg-[--friend-action-hover]",
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
  const dialogs = useWorkspaceDialogs();
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
            <div className="flex flex-col gap-3 p-2.5">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          className="inline-flex h-8 w-auto max-w-full items-center rounded-xl px-2.5 font-semibold text-[0.95rem] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-popup-open:bg-accent data-popup-open:text-foreground"
                          type="button"
                        />
                      }
                    >
                      <span className="truncate">
                        {view.activeServer?.name ?? "Server"}
                      </span>
                      <ChevronDownIcon className="ml-1 size-4 shrink-0 opacity-75 transition-transform group-aria-expanded/button:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-64 rounded-2xl border border-sidebar-border bg-popover p-2"
                      sideOffset={8}
                    >
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          className="min-h-10 justify-between rounded-xl px-3 py-2 font-medium"
                          onClick={() => ui.setIsInviteOpen(true)}
                        >
                          <span>Invite to Server</span>
                          <InviteToServerIcon className="size-4 text-muted-foreground" />
                        </DropdownMenuItem>
                        <DropdownMenuItem className="min-h-10 justify-between rounded-xl px-3 py-2 font-medium">
                          <span>Server Settings</span>
                          <Settings2Icon className="size-4 text-muted-foreground" />
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {view.canCreateServerInvites ? (
                  <Tooltip>
                    <TooltipTrigger
                      onClick={() => ui.setIsInviteOpen(true)}
                      render={
                        <button
                          className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          type="button"
                        />
                      }
                    >
                      <InviteToServerIcon className="size-5" />
                      <span className="sr-only">Invite to server</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">Invite to Server</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>

              <div className="border-sidebar-border border-b" />

              <ChannelSection
                activeChannelId={view.routeChannelId}
                canManageChannels={view.permissions.manageChannels}
                channels={view.textChannels}
                icon={HashIcon}
                label="Text channels"
                onAddChannel={() =>
                  dialogs.openCreateChannel("text", "Text Channels")
                }
                onReorder={(orderedChannelIds) =>
                  dialogs.reorderChannelSection("text", orderedChannelIds)
                }
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
                canManageChannels={view.permissions.manageChannels}
                channels={view.voiceChannels}
                counts={view.voicePresence}
                icon={Volume2Icon}
                label="Voice channels"
                onAddChannel={() =>
                  dialogs.openCreateChannel("voice", "Voice Channels")
                }
                onReorder={(orderedChannelIds) =>
                  dialogs.reorderChannelSection("voice", orderedChannelIds)
                }
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
        <div className="flex items-center gap-3 rounded-2xl bg-accent px-3 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
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
                      <InviteToServerIcon className="size-4" />
                      Invite to Server
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
        <Avatar className="size-9">
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
        <div className="truncate font-semibold text-[0.94rem]">
          {displayName}
        </div>
        <div className="truncate text-muted-foreground text-xs">{subtitle}</div>
      </div>
    </button>
  );
}

function ChannelSection({
  activeChannelId,
  canManageChannels,
  channels,
  counts,
  icon: Icon,
  label,
  onAddChannel,
  onReorder,
  onSelect,
}: {
  activeChannelId: Id<"channels"> | null;
  canManageChannels: boolean;
  channels: Doc<"channels">[];
  counts?: VoicePresenceItem[];
  icon: typeof HashIcon;
  label: string;
  onAddChannel: () => void;
  onReorder: (orderedChannelIds: Id<"channels">[]) => Promise<boolean>;
  onSelect: (channelId: Id<"channels">) => void;
}) {
  const [orderedChannels, setOrderedChannels] = useState(channels);

  useEffect(() => {
    setOrderedChannels(channels);
  }, [channels]);

  const handleDragEnd = ({ destination, source }: DropResult) => {
    if (!(destination && destination.index !== source.index)) {
      return;
    }

    const previousChannels = orderedChannels;
    const nextChannels = [...orderedChannels];
    const [movedChannel] = nextChannels.splice(source.index, 1);
    if (!movedChannel) {
      return;
    }

    nextChannels.splice(destination.index, 0, movedChannel);
    setOrderedChannels(nextChannels);
    onReorder(nextChannels.map((channel) => channel._id)).then((didPersist) => {
      if (!didPersist) {
        setOrderedChannels(previousChannels);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 px-2">
        <div className="font-black text-[0.65rem] text-muted-foreground uppercase tracking-[0.16em]">
          {label}
        </div>
        {canManageChannels ? (
          <Tooltip>
            <TooltipTrigger
              onClick={onAddChannel}
              render={
                <button
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  type="button"
                />
              }
            >
              <PlusIcon className="size-4" />
              <span className="sr-only">Create {label.toLowerCase()}</span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Create {label.toLowerCase()}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {orderedChannels.length ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={label}>
            {(droppableProvided) => (
              <div
                {...droppableProvided.droppableProps}
                className="flex flex-col gap-1"
                ref={droppableProvided.innerRef}
              >
                {orderedChannels.map((channel, index) => {
                  const count =
                    counts?.filter((entry) => entry.channelId === channel._id)
                      .length ?? 0;
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
                    <Draggable
                      disableInteractiveElementBlocking
                      draggableId={channel._id}
                      index={index}
                      isDragDisabled={!canManageChannels}
                      key={channel._id}
                    >
                      {(draggableProvided, snapshot) => (
                        <button
                          className={cn(
                            listItemClassName,
                            activeChannelId === channel._id
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            canManageChannels &&
                              "cursor-grab active:cursor-grabbing",
                            snapshot.isDragging &&
                              "border border-sidebar-border bg-sidebar shadow-lg"
                          )}
                          onClick={() => onSelect(channel._id)}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...(canManageChannels
                            ? draggableProvided.dragHandleProps
                            : {})}
                          type="button"
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="flex-1 truncate font-semibold text-[0.9rem]">
                            {getChannelNameText(channel)}
                          </span>
                          <div className="shrink-0">{trailingContent}</div>
                        </button>
                      )}
                    </Draggable>
                  );
                })}
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Empty className="border border-sidebar-border bg-accent/60 p-4 text-foreground">
          <EmptyHeader>
            <EmptyTitle>No channels</EmptyTitle>
            <EmptyDescription>
              Create one to start the server loop.
            </EmptyDescription>
          </EmptyHeader>
          {canManageChannels ? (
            <Button
              className="mt-3 self-start"
              onClick={onAddChannel}
              size="sm"
            >
              <PlusIcon />
              Create {label.toLowerCase()}
            </Button>
          ) : null}
        </Empty>
      )}
    </div>
  );
}

function InviteToServerIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM16.62 13.17c-.22.29-.65.37-.92.14-.34-.3-.7-.57-1.09-.82-.52-.33-.7-1.05-.47-1.63.11-.27.2-.57.26-.87.11-.54.55-1 1.1-.92 1.6.2 3.04.92 4.15 1.98.3.27-.25.95-.65.95a3 3 0 0 0-2.38 1.17ZM15.19 15.61c.13.16.02.39-.19.39a3 3 0 0 0-1.52 5.59c.2.12.26.41.02.41h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5a7.5 7.5 0 0 1 13.19-4.89ZM9.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 22Z"
        fill="currentColor"
      />
      <path
        d="M19 14a1 1 0 0 1 1 1v3h3a1 1 0 0 1 0 2h-3v3a1 1 0 0 1-2 0v-3h-3a1 1 0 1 1 0-2h3v-3a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}
