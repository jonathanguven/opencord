import {
  ChevronDownIcon,
  CopyIcon,
  HashIcon,
  HeadphonesIcon,
  LogOutIcon,
  MessageSquareIcon,
  MicIcon,
  PlusIcon,
  SearchIcon,
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ConversationListItem,
  ServerListItem,
  VoicePresenceItem,
} from "@/components/workspace/workspace-types";
import { getDisplayName, getInitials } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { PermissionSet } from "../../../shared/domain";

const SIDEBAR_RAIL_TONES = [
  "from-sky-500 to-cyan-400",
  "from-fuchsia-500 to-pink-500",
  "from-emerald-500 to-lime-400",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-indigo-500",
  "from-rose-500 to-red-500",
] as const;

interface WorkspaceRailProps {
  activeServerId: Id<"servers"> | null;
  isFriendsView: boolean;
  onCreateServer: () => void;
  onOpenFriends: () => void;
  onOpenServer: (serverId: Id<"servers">) => void;
  servers: ServerListItem[] | undefined;
}

interface WorkspaceSidebarProps {
  activeChannelId: Id<"channels"> | null;
  activeConversationId: Id<"conversations"> | null;
  activeServer: Doc<"servers"> | null;
  allowServerInvites: boolean;
  conversations: ConversationListItem[] | undefined;
  currentUser: Doc<"users"> | null | undefined;
  isFriendsView: boolean;
  onCreateChannel: () => void;
  onOpenAddFriend: () => void;
  onOpenConversation: (conversationId: Id<"conversations">) => void;
  onOpenInvite: () => void;
  onOpenServerChannel: (channelId: Id<"channels">) => void;
  onOpenTab: (value: string) => void;
  onSignOut: () => Promise<void>;
  permissions: PermissionSet;
  textChannels: Doc<"channels">[];
  voiceChannels: Doc<"channels">[];
  voicePresence: VoicePresenceItem[] | undefined;
}

interface DiscordDmRowProps {
  active?: boolean;
  avatarUrl?: string | null;
  displayName: string;
  onClick: () => void;
  presence?: "active" | "idle";
  subtitle: string;
}

export function WorkspaceRail({
  activeServerId,
  isFriendsView,
  onCreateServer,
  onOpenFriends,
  onOpenServer,
  servers,
}: WorkspaceRailProps) {
  return (
    <div className="flex w-[76px] shrink-0 flex-col items-center justify-between border-white/5 border-r bg-[#1e1f22] px-3 py-4">
      <div className="flex flex-col items-center gap-3">
        <Tooltip>
          <TooltipTrigger
            onClick={onOpenFriends}
            render={
              <Button
                className={cn(
                  "size-12 rounded-[1.35rem] border border-white/5 bg-[#5865f2] text-white shadow-[0_10px_30px_rgba(88,101,242,0.35)] hover:bg-[#6d78f6]",
                  isFriendsView &&
                    "rounded-[1rem] bg-white text-[#1e1f22] hover:bg-white"
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

        <Separator className="w-10 bg-white/8" />

        <ScrollArea className="max-h-[calc(100svh-11rem)]">
          <div className="flex flex-col items-center gap-3">
            {servers?.map((entry, index) => {
              if (!entry.server) {
                return null;
              }

              const server = entry.server;
              const isActive = activeServerId === server._id;

              return (
                <Tooltip key={server._id}>
                  <TooltipTrigger
                    onClick={() => onOpenServer(server._id)}
                    render={
                      <Button
                        className={cn(
                          "size-12 rounded-[1.35rem] border border-white/5 bg-[#2b2d31] text-white transition-all hover:bg-[#35373c]",
                          isActive && "rounded-[1rem] bg-white text-[#1e1f22]"
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
            onClick={onCreateServer}
            render={
              <Button
                className="size-12 rounded-[1.35rem] border border-white/5 bg-[#2b2d31] text-[#dcddde] hover:bg-[#35373c]"
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

      <div className="size-12 rounded-[1.35rem] border border-white/5 bg-[#2b2d31]" />
    </div>
  );
}

export function WorkspaceSidebar({
  activeChannelId,
  activeConversationId,
  activeServer,
  allowServerInvites,
  conversations,
  currentUser,
  isFriendsView,
  onCreateChannel,
  onOpenAddFriend,
  onOpenConversation,
  onOpenInvite,
  onOpenServerChannel,
  onOpenTab,
  onSignOut,
  permissions,
  textChannels,
  voiceChannels,
  voicePresence,
}: WorkspaceSidebarProps) {
  const sidebarProfileName = getDisplayName(currentUser);
  const sidebarProfileHandle = `@${currentUser?.handle ?? "finish-setup"}`;
  const directMessageCount = conversations?.length ?? 0;

  return (
    <aside className="flex h-full flex-col border-white/5 border-r bg-[#2b2d31]">
      <div className="border-white/6 border-b p-3">
        <button
          className="flex h-14 w-full items-center rounded-2xl border border-white/6 bg-[#1e1f22] px-5 text-left font-bold text-[#f2f3f5] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          type="button"
        >
          <SearchIcon className="mr-3 size-5 text-[#8e9297]" />
          <span className="truncate">
            {isFriendsView
              ? "Find or start a conversation"
              : `Search ${activeServer?.name ?? "channels"}`}
          </span>
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {isFriendsView ? (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-3">
              <button
                className="flex w-full items-center gap-3 rounded-2xl bg-[#404249] px-3 py-3 text-left font-semibold text-[0.95rem] text-white transition-colors"
                onClick={() => onOpenTab("all")}
                type="button"
              >
                <UsersIcon className="size-5 shrink-0" />
                <span className="truncate">Friends</span>
              </button>

              <div className="mt-3 flex items-center justify-between px-2">
                <div className="font-semibold text-[#b5bac1] text-sm">
                  Direct Messages
                </div>
                <button
                  className="rounded-md p-1 text-[#b5bac1] transition-colors hover:bg-[#35373c] hover:text-white"
                  onClick={onOpenAddFriend}
                  type="button"
                >
                  <PlusIcon className="size-4" />
                  <span className="sr-only">Add friend</span>
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {conversations?.map((conversation) => (
                  <DiscordDmRow
                    active={activeConversationId === conversation._id}
                    avatarUrl={conversation.otherUser?.avatarUrl}
                    displayName={getDisplayName(conversation.otherUser)}
                    key={conversation._id}
                    onClick={() => onOpenConversation(conversation._id)}
                    presence={conversation.activeCall ? "active" : "idle"}
                    subtitle={
                      conversation.latestMessage?.body ?? "Start chatting"
                    }
                  />
                ))}

                {conversations?.length ? null : (
                  <Empty className="mt-2 border border-white/8 bg-[#232428] text-[#dcddde]">
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
              <div className="rounded-2xl border border-white/6 bg-[#232428] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-lg text-white">
                      {activeServer?.name ?? "Server"}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[#a7aab4] text-sm">
                      {activeServer?.description ||
                        "Flat channels, invite-only access, and reactive voice presence."}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          className="rounded-xl bg-white/0 text-[#b5bac1] hover:bg-[#35373c] hover:text-white"
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
                        <DropdownMenuItem onClick={onOpenInvite}>
                          <CopyIcon />
                          Create invite
                        </DropdownMenuItem>
                        {permissions.manageChannels || permissions.admin ? (
                          <DropdownMenuItem onClick={onCreateChannel}>
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
                activeChannelId={activeChannelId}
                channels={textChannels}
                icon={HashIcon}
                label="Text channels"
                onSelect={onOpenServerChannel}
              />

              <ChannelSection
                activeChannelId={activeChannelId}
                channels={voiceChannels}
                counts={voicePresence}
                icon={Volume2Icon}
                label="Voice channels"
                onSelect={onOpenServerChannel}
              />
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="border-white/6 border-t p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-[#22384b] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <Avatar className="size-11">
            <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#5865f2]/30 text-white">
              {getInitials(sidebarProfileName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-[#3dde8b] text-lg">
              {sidebarProfileName}
            </div>
            <div className="truncate text-sm text-white/75">
              {sidebarProfileHandle}
            </div>
            <div className="truncate text-sm text-white/70">
              {isFriendsView
                ? `${directMessageCount} open DMs`
                : (activeServer?.name ?? "OpenCord")}
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <span className="rounded-lg p-1.5">
              <MicIcon className="size-5" />
            </span>
            <span className="rounded-lg p-1.5">
              <HeadphonesIcon className="size-5" />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="rounded-lg p-1.5 text-white/90 hover:bg-white/10 hover:text-white"
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
                  <DropdownMenuItem onClick={onOpenAddFriend}>
                    <UserPlusIcon />
                    Add friend
                  </DropdownMenuItem>
                  {allowServerInvites ? (
                    <DropdownMenuItem onClick={onOpenInvite}>
                      <CopyIcon />
                      Create invite
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOutIcon />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChevronDownIcon className="size-4 text-white/80" />
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
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
        active
          ? "bg-[#404249] text-white"
          : "text-[#b5bac1] hover:bg-[#35373c] hover:text-[#eceef2]"
      )}
      onClick={onClick}
      type="button"
    >
      <div className="relative shrink-0">
        <Avatar className="size-10">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className="bg-[#5865f2]/20 text-white">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute right-0 bottom-0 size-3 rounded-full border-2 border-[#2b2d31]",
            presence === "active" ? "bg-emerald-400" : "bg-[#7d818a]"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[0.98rem]">
          {displayName}
        </div>
        <div className="truncate text-[#8e9297] text-xs">{subtitle}</div>
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
      <div className="px-2 font-black text-[#949ba4] text-xs uppercase tracking-[0.16em]">
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
                <span className="rounded-full border border-white/10 px-2 py-0.5 font-bold text-[#b5bac1] text-[0.68rem]">
                  Private
                </span>
              );
            }
          } else {
            trailingContent = (
              <span className="rounded-full bg-white/8 px-2 py-0.5 font-bold text-[#dcddde] text-[0.7rem]">
                {count}
              </span>
            );
          }

          return (
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                activeChannelId === channel._id
                  ? "bg-[#404249] text-white"
                  : "text-[#b5bac1] hover:bg-[#35373c] hover:text-[#eceef2]"
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
        <Empty className="border border-white/8 bg-[#232428] p-4 text-[#dcddde]">
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
