import {
  DragDropContext,
  Draggable,
  type DraggableProvided,
  Droppable,
  type DroppableProvided,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ChevronDownIcon,
  HashIcon,
  HeadphonesIcon,
  LogOutIcon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  MonitorUpIcon,
  PencilIcon,
  PhoneOffIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  VideoIcon,
  Volume2Icon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { WorkspaceCommandPaletteTrigger } from "@/components/workspace/workspace-command-palette";
import {
  useWorkspaceCall,
  useWorkspaceDialogs,
  useWorkspaceNavigation,
  useWorkspaceUi,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import type { VoicePresenceItem } from "@/components/workspace/workspace-types";
import { getChannelNameText } from "@/lib/channel-name";
import { getMessagePreview } from "@/lib/message-preview";
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
  "size-12 rounded-[1.35rem] border border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-accent hover:text-accent-foreground";

const listItemClassName =
  "w-full justify-start gap-2 rounded-lg px-2 py-1.5 text-left";

const DEFAULT_AUDIO_DEVICE_ID = "default";
const VOICE_TIMER_INTERVAL_MS = 1000;

interface AudioDeviceOption {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
}

function getDroppableBindings(droppableProvided: DroppableProvided) {
  "use no memo";

  return {
    droppableContextId:
      droppableProvided.droppableProps["data-rfd-droppable-context-id"],
    droppableId: droppableProvided.droppableProps["data-rfd-droppable-id"],
    innerRef: droppableProvided.innerRef,
    placeholder: droppableProvided.placeholder,
  };
}

function getDraggableBindings(
  draggableProvided: DraggableProvided,
  canManageChannels: boolean
) {
  "use no memo";

  const { dragHandleProps, draggableProps, innerRef } = draggableProvided;

  return {
    ariaDescribedBy: dragHandleProps?.["aria-describedby"],
    dataDraggableContextId: draggableProps["data-rfd-draggable-context-id"],
    dataDraggableId: draggableProps["data-rfd-draggable-id"],
    dataDragHandleContextId: canManageChannels
      ? (dragHandleProps?.["data-rfd-drag-handle-context-id"] ?? undefined)
      : undefined,
    dataDragHandleDraggableId: canManageChannels
      ? (dragHandleProps?.["data-rfd-drag-handle-draggable-id"] ?? undefined)
      : undefined,
    draggable: canManageChannels
      ? (dragHandleProps?.draggable ?? undefined)
      : undefined,
    innerRef,
    onDragStart: canManageChannels
      ? (dragHandleProps?.onDragStart ?? undefined)
      : undefined,
    onTransitionEnd: draggableProps.onTransitionEnd,
    role: canManageChannels ? (dragHandleProps?.role ?? undefined) : undefined,
    style: draggableProps.style,
    tabIndex: canManageChannels
      ? (dragHandleProps?.tabIndex ?? undefined)
      : undefined,
  };
}

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
              onClick={navigation.navigateToFriendsArea}
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
    </div>
  );
}

export function WorkspaceSidebar() {
  const call = useWorkspaceCall();
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const dialogs = useWorkspaceDialogs();
  const navigation = useWorkspaceNavigation();
  const isFriendsHomeActive = view.isFriendsView && !view.activeConversationId;

  return (
    <aside className="flex h-full flex-col border-sidebar-border border-r bg-sidebar pb-[60px] text-sidebar-foreground">
      {view.isFriendsView ? (
        <div className="border-sidebar-border border-b p-2.5">
          <WorkspaceCommandPaletteTrigger />
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {view.isFriendsView ? (
          <ScrollArea
            className="h-full"
            scrollbarClassName="data-vertical:w-2 data-horizontal:h-1"
            thumbClassName="bg-white/40"
          >
            <div className="flex flex-col gap-1.5 p-2.5">
              <Button
                className={cn(
                  "h-auto w-full justify-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left font-semibold text-[0.93rem]",
                  isFriendsHomeActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => navigation.navigate("/channels")}
                type="button"
                variant="plain"
              >
                <UsersIcon className="size-5 shrink-0" />
                <span className="truncate">Friends</span>
              </Button>

              <div className="mt-1.5 flex items-center justify-between px-1.5">
                <div className="font-semibold text-muted-foreground text-sm">
                  Direct Messages
                </div>
                <Button
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={navigation.showAddFriendTab}
                  size="icon-xs"
                  type="button"
                  variant="plain"
                >
                  <PlusIcon className="size-4" />
                  <span className="sr-only">Add friend</span>
                </Button>
              </div>

              <div className="flex flex-col gap-0.5">
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
                    subtitle={getMessagePreview(
                      conversation.latestMessage,
                      "Start chatting"
                    )}
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
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-sidebar-border border-b p-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          className="h-8 w-auto max-w-full rounded-xl px-2.5 font-semibold text-[0.95rem] text-muted-foreground hover:bg-accent hover:text-foreground data-popup-open:bg-accent data-popup-open:text-foreground"
                          type="button"
                          variant="plain"
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
                          <SettingsIcon className="size-4 text-muted-foreground" />
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
                        <Button
                          className="ml-auto size-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                          size="icon"
                          type="button"
                          variant="plain"
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
            </div>

            <ScrollArea
              className="group/server-channel-scroll min-h-0 flex-1"
              scrollbarClassName="data-vertical:w-1.5 data-horizontal:h-1 opacity-0 transition-opacity group-hover/server-channel-scroll:opacity-100"
              thumbClassName="bg-white/35"
            >
              <div className="flex flex-col gap-2 p-2">
                <ChannelSection
                  activeChannelId={view.routeChannelId}
                  canManageChannels={view.permissions.manageChannels}
                  channels={view.textChannels}
                  icon={HashIcon}
                  label="Text channels"
                  onAddChannel={() =>
                    dialogs.openCreateChannel("text", "Text Channels")
                  }
                  onDeleteChannel={dialogs.openDeleteChannel}
                  onRenameChannel={dialogs.openRenameChannel}
                  onReorder={(orderedChannelIds) =>
                    dialogs.reorderChannelSection("text", orderedChannelIds)
                  }
                  onSelect={(channel) => {
                    if (!view.activeServerId) {
                      return;
                    }

                    navigation.navigate(
                      getChannelPath(view.activeServerId, channel._id)
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
                  onDeleteChannel={dialogs.openDeleteChannel}
                  onRenameChannel={dialogs.openRenameChannel}
                  onReorder={(orderedChannelIds) =>
                    dialogs.reorderChannelSection("voice", orderedChannelIds)
                  }
                  onSelect={async (channel) => {
                    if (!view.activeServerId) {
                      return;
                    }

                    navigation.navigate(
                      getChannelPath(view.activeServerId, channel._id)
                    );

                    await call.joinVoiceChannel(channel);
                  }}
                />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </aside>
  );
}

export function WorkspaceProfileDock() {
  const call = useWorkspaceCall();
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const navigation = useWorkspaceNavigation();
  const { inputDevices, outputDevices } = useAudioDeviceOptions();
  const currentUser = view.current?.user;
  const profileName = getDisplayName(currentUser);
  const profileHandle = `@${currentUser?.handle ?? "finish-setup"}`;
  const activeVoiceCall =
    call.activeCall?.kind === "voice" ? call.activeCall : null;
  const [selectedInputId, setSelectedInputId] = useState(
    DEFAULT_AUDIO_DEVICE_ID
  );
  const [selectedOutputId, setSelectedOutputId] = useState(
    DEFAULT_AUDIO_DEVICE_ID
  );
  const muteButtonLabel = activeVoiceCall?.muted
    ? "Unmute microphone"
    : "Mute microphone";
  const deafenButtonLabel = activeVoiceCall?.deafened
    ? "Undeafen audio"
    : "Deafen audio";

  return (
    <div className="p-1.5">
      <div
        className={cn(
          "rounded-md border border-border/60 bg-accent",
          activeVoiceCall
            ? "flex flex-col gap-1 px-2 py-1.5"
            : "flex h-14 items-center px-3"
        )}
      >
        {activeVoiceCall ? (
          <>
            <div className="flex items-center gap-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-400 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
                  <Volume2Icon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-[0.82rem] text-emerald-400 leading-tight">
                    Voice Connected
                  </div>
                  <div className="truncate font-semibold text-[0.72rem] text-foreground/90 leading-tight">
                    {activeVoiceCall.label}
                  </div>
                </div>
              </div>
              <Button
                aria-label={
                  call.isCallConnecting ? "Cancel call" : "Leave call"
                }
                className="rounded-md bg-background/20 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                onClick={call.leaveActiveCall}
                size="icon-sm"
                type="button"
                variant="plain"
              >
                <PhoneOffIcon className="size-3.5" />
              </Button>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-1">
              <Button
                className="h-7 justify-center gap-1 rounded-md bg-white/8 px-1.5 text-[0.68rem] text-foreground/85 hover:bg-white/14"
                onClick={call.triggerCamera}
                type="button"
                variant="plain"
              >
                <VideoIcon className="size-3" />
                Camera
              </Button>
              <Button
                className="h-7 justify-center gap-1 rounded-md bg-white/8 px-1.5 text-[0.68rem] text-foreground/85 hover:bg-white/14"
                onClick={call.triggerShareScreen}
                type="button"
                variant="plain"
              >
                <MonitorUpIcon className="size-3" />
                Share Screen
              </Button>
            </div>

            <div className="h-px bg-white/6" />
          </>
        ) : null}

        <div
          className={cn(
            "flex w-full min-w-0 items-center gap-1.5",
            activeVoiceCall && "h-11.5"
          )}
        >
          <Avatar className="size-9">
            <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {getInitials(profileName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-[0.88rem] text-foreground leading-tight">
              {profileName}
            </div>
            <div className="truncate text-[0.7rem] text-muted-foreground leading-tight">
              {profileHandle}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-0.75 text-muted-foreground">
            <div
              className={cn(
                "flex items-center overflow-hidden rounded-md",
                activeVoiceCall?.muted
                  ? "bg-destructive/20 text-destructive"
                  : "bg-background/20 hover:bg-background/40"
              )}
            >
              <Button
                aria-label={muteButtonLabel}
                className={cn(
                  "h-7 w-8 rounded-none rounded-l-md p-0 hover:bg-transparent",
                  activeVoiceCall?.muted
                    ? "text-destructive hover:text-destructive"
                    : "text-muted-foreground hover:text-foreground"
                )}
                disabled={!activeVoiceCall}
                onClick={call.toggleMute}
                size="none"
                type="button"
                variant="ghost"
              >
                {activeVoiceCall?.muted ? (
                  <MicOffIcon className="size-4" />
                ) : (
                  <MicIcon className="size-4" />
                )}
              </Button>
              <AudioDeviceMenu
                devices={inputDevices}
                isActive={Boolean(activeVoiceCall?.muted)}
                label="Input"
                onValueChange={setSelectedInputId}
                selectedDeviceId={selectedInputId}
              />
            </div>
            <div
              className={cn(
                "flex items-center overflow-hidden rounded-md",
                activeVoiceCall?.deafened
                  ? "bg-destructive/20 text-destructive"
                  : "bg-background/20 hover:bg-background/40"
              )}
            >
              <Button
                aria-label={deafenButtonLabel}
                className={cn(
                  "h-7 w-8 rounded-none rounded-l-md p-0 hover:bg-transparent",
                  activeVoiceCall?.deafened
                    ? "text-destructive hover:text-destructive"
                    : "text-muted-foreground hover:text-foreground"
                )}
                disabled={!activeVoiceCall}
                onClick={call.toggleDeafen}
                size="none"
                type="button"
                variant="ghost"
              >
                <HeadphonesIcon className="size-4" />
              </Button>
              <AudioDeviceMenu
                devices={outputDevices}
                isActive={Boolean(activeVoiceCall?.deafened)}
                label="Output"
                onValueChange={setSelectedOutputId}
                selectedDeviceId={selectedOutputId}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label="User settings"
                    className="rounded-md p-1.15 text-muted-foreground hover:bg-background/40 hover:text-foreground"
                    size="icon-sm"
                    variant="ghost"
                  />
                }
              >
                <SettingsIcon className="size-[1.05rem] transition-transform duration-200 group-hover/button:rotate-90" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuLabel>
                  {profileName}
                  <div className="font-normal text-muted-foreground text-xs">
                    {profileHandle}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function AudioDeviceMenu({
  devices,
  isActive = false,
  label,
  onValueChange,
  selectedDeviceId,
}: {
  devices: AudioDeviceOption[];
  isActive?: boolean;
  label: string;
  onValueChange: (value: string) => void;
  selectedDeviceId: string;
}) {
  const hasDevices = devices.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`${label} options`}
            className={cn(
              "h-7 w-4.5 rounded-none rounded-r-md p-0 hover:bg-transparent",
              isActive
                ? "text-destructive hover:text-destructive"
                : "text-muted-foreground hover:text-foreground"
            )}
            size="none"
            variant="ghost"
          />
        }
      >
        <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" side="top">
        <DropdownMenuLabel>{label} devices</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasDevices ? (
          <DropdownMenuRadioGroup
            onValueChange={onValueChange}
            value={selectedDeviceId}
          >
            {devices.map((device) => (
              <DropdownMenuRadioItem
                className="min-h-9"
                key={device.deviceId}
                value={device.deviceId}
              >
                <span className="truncate">{device.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        ) : (
          <DropdownMenuItem className="min-h-9 text-muted-foreground" disabled>
            No {label.toLowerCase()} devices found
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
    <Button
      className={cn(
        listItemClassName,
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      onClick={onClick}
      size="none"
      type="button"
      variant="plain"
    >
      <div className="relative shrink-0">
        <Avatar className="size-8">
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
        <div className="truncate font-semibold text-[0.92rem] leading-tight">
          {displayName}
        </div>
        <div className="truncate text-muted-foreground text-xs leading-tight">
          {subtitle}
        </div>
      </div>
    </Button>
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
  onDeleteChannel,
  onReorder,
  onRenameChannel,
  onSelect,
}: {
  activeChannelId: Id<"channels"> | null;
  canManageChannels: boolean;
  channels: Doc<"channels">[];
  counts?: VoicePresenceItem[];
  icon: typeof HashIcon;
  label: string;
  onAddChannel: () => void;
  onDeleteChannel: (channel: Doc<"channels">) => void;
  onReorder: (orderedChannelIds: Id<"channels">[]) => Promise<boolean>;
  onRenameChannel: (channel: Doc<"channels">) => void;
  onSelect: (channel: Doc<"channels">) => Promise<void> | void;
}) {
  const [orderedChannels, setOrderedChannels] = useState(channels);
  const now = useTicker(typeof counts !== "undefined");

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
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 px-1.5">
        <div className="font-black text-[0.63rem] text-muted-foreground uppercase tracking-[0.14em]">
          {label}
        </div>
        {canManageChannels ? (
          <Tooltip>
            <TooltipTrigger
              onClick={onAddChannel}
              render={
                <Button
                  className="size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  size="icon-xs"
                  type="button"
                  variant="plain"
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
              <DroppableChannelList droppableProvided={droppableProvided}>
                {orderedChannels.map((channel, index) => {
                  const channelMembers =
                    counts?.filter(
                      (entry) => entry.channelId === channel._id
                    ) ?? [];
                  const count = channelMembers.length;
                  const callStartedAt =
                    count > 0
                      ? channelMembers.reduce(
                          (earliestConnectedAt, member) =>
                            Math.min(earliestConnectedAt, member.connectedAt),
                          channelMembers[0]?.connectedAt ?? now
                        )
                      : null;
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
                        <ChannelRow
                          active={activeChannelId === channel._id}
                          canManageChannels={canManageChannels}
                          channel={channel}
                          channelMembers={channelMembers}
                          count={count}
                          draggableProvided={draggableProvided}
                          icon={Icon}
                          isDragging={snapshot.isDragging}
                          now={now}
                          onDeleteChannel={onDeleteChannel}
                          onRenameChannel={onRenameChannel}
                          onSelect={onSelect}
                          showVoicePresence={typeof counts !== "undefined"}
                          startedAt={callStartedAt}
                          trailingContent={trailingContent}
                        />
                      )}
                    </Draggable>
                  );
                })}
              </DroppableChannelList>
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

function DroppableChannelList({
  children,
  droppableProvided,
}: {
  children: ReactNode;
  droppableProvided: DroppableProvided;
}) {
  "use no memo";

  const { droppableContextId, droppableId, innerRef, placeholder } =
    getDroppableBindings(droppableProvided);

  return (
    <div
      className="flex flex-col gap-1"
      data-rfd-droppable-context-id={droppableContextId}
      data-rfd-droppable-id={droppableId}
      ref={innerRef}
    >
      {children}
      {placeholder}
    </div>
  );
}

function ChannelRow({
  active,
  canManageChannels,
  channel,
  channelMembers,
  count,
  draggableProvided,
  icon: Icon,
  isDragging,
  now,
  onDeleteChannel,
  onRenameChannel,
  onSelect,
  showVoicePresence,
  startedAt,
  trailingContent,
}: {
  active: boolean;
  canManageChannels: boolean;
  channel: Doc<"channels">;
  channelMembers: VoicePresenceItem[];
  count: number;
  draggableProvided: DraggableProvided;
  icon: typeof HashIcon;
  isDragging: boolean;
  now: number;
  onDeleteChannel: (channel: Doc<"channels">) => void;
  onRenameChannel: (channel: Doc<"channels">) => void;
  onSelect: (channel: Doc<"channels">) => Promise<void> | void;
  showVoicePresence: boolean;
  startedAt: number | null;
  trailingContent: ReactNode;
}) {
  "use no memo";

  const {
    ariaDescribedBy,
    dataDraggableContextId,
    dataDraggableId,
    dataDragHandleContextId,
    dataDragHandleDraggableId,
    draggable,
    innerRef,
    onDragStart,
    onTransitionEnd,
    role,
    style,
    tabIndex,
  } = getDraggableBindings(draggableProvided, canManageChannels);

  const channelButton = (
    <Button
      aria-describedby={ariaDescribedBy}
      className={cn(
        listItemClassName,
        "flex-col items-stretch gap-1",
        active
          ? "text-sidebar-accent-foreground"
          : "text-muted-foreground hover:text-foreground",
        canManageChannels && "cursor-grab active:cursor-grabbing",
        isDragging && "border border-sidebar-border bg-sidebar shadow-lg"
      )}
      data-rfd-drag-handle-context-id={dataDragHandleContextId}
      data-rfd-drag-handle-draggable-id={dataDragHandleDraggableId}
      data-rfd-draggable-context-id={dataDraggableContextId}
      data-rfd-draggable-id={dataDraggableId}
      draggable={draggable}
      onClick={async () => {
        await onSelect(channel);
      }}
      onDragStart={onDragStart}
      onTransitionEnd={onTransitionEnd}
      ref={innerRef}
      role={role}
      size="none"
      style={style}
      tabIndex={tabIndex}
      type="button"
      variant="plain"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2 py-1",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-accent/90"
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            count > 0 && showVoicePresence && "text-emerald-400"
          )}
        />
        <span className="flex-1 truncate font-semibold text-[0.9rem]">
          {getChannelNameText(channel)}
        </span>
        {startedAt && showVoicePresence ? (
          <span className="shrink-0 font-bold text-[0.8rem] text-emerald-400 tabular-nums">
            {formatVoiceDuration(now - startedAt)}
          </span>
        ) : (
          <div className="shrink-0">{trailingContent}</div>
        )}
      </div>
      {count > 0 && showVoicePresence ? (
        <VoiceParticipantStrip members={channelMembers} />
      ) : null}
    </Button>
  );

  if (!canManageChannels) {
    return channelButton;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{channelButton}</ContextMenuTrigger>
      <ContextMenuContent className="w-52 rounded-xl border border-sidebar-border bg-popover p-2">
        <ContextMenuGroup>
          <ContextMenuItem
            className="min-h-10 rounded-lg px-3 py-2 font-medium"
            onClick={() => onRenameChannel(channel)}
          >
            <PencilIcon />
            Rename channel
          </ContextMenuItem>
          <ContextMenuItem
            className="min-h-10 rounded-lg px-3 py-2 font-medium"
            onClick={() => onDeleteChannel(channel)}
            variant="destructive"
          >
            <Trash2Icon />
            Delete channel
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function VoiceParticipantStrip({ members }: { members: VoicePresenceItem[] }) {
  const call = useWorkspaceCall();
  const view = useWorkspaceView();
  const currentUserId = view.current?.user?._id;

  return (
    <div className="flex flex-col gap-1 pl-6">
      {members.map((member) => {
        const displayName = getDisplayName(member.user);
        const isCurrentUser = member.user?._id === currentUserId;
        const showSpeakingRing = Boolean(
          isCurrentUser &&
            call.activeCall?.kind === "voice" &&
            call.isSelfSpeaking
        );

        return (
          <div
            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-[0.82rem] text-sidebar-foreground/90 hover:bg-accent/40"
            key={member._id}
          >
            <Avatar
              className={cn(
                "size-6 shrink-0",
                showSpeakingRing &&
                  "ring-2 ring-emerald-400 ring-offset-2 ring-offset-sidebar"
              )}
            >
              <AvatarImage src={member.user?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-[0.55rem] text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate font-medium leading-none">
              {displayName}
            </span>
            {member.muted ? (
              <MicOffIcon
                aria-label={`${displayName} is muted`}
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function useTicker(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, VOICE_TIMER_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  return now;
}

function formatVoiceDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function useAudioDeviceOptions() {
  const [devices, setDevices] = useState<AudioDeviceOption[]>([]);

  useEffect(() => {
    if (!("mediaDevices" in navigator)) {
      return;
    }

    let isSubscribed = true;

    const syncDevices = async () => {
      const availableDevices = await navigator.mediaDevices.enumerateDevices();
      if (!isSubscribed) {
        return;
      }

      setDevices(
        availableDevices.map((device, index) => ({
          deviceId: device.deviceId || `${device.kind}-${index}`,
          kind: device.kind,
          label:
            device.label ||
            `${device.kind === "audioinput" ? "Microphone" : "Speaker"} ${index + 1}`,
        }))
      );
    };

    syncDevices().catch(() => undefined);
    navigator.mediaDevices.addEventListener("devicechange", syncDevices);

    return () => {
      isSubscribed = false;
      navigator.mediaDevices.removeEventListener("devicechange", syncDevices);
    };
  }, []);

  return {
    inputDevices: devices.filter((device) => device.kind === "audioinput"),
    outputDevices: devices.filter((device) => device.kind === "audiooutput"),
  };
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
