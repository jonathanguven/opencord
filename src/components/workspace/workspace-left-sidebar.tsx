import { type RequestForQueries, useQueries } from "convex/react";
import Fuse from "fuse.js";
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
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
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
import {
  useWorkspaceFriends,
  useWorkspaceNavigation,
  useWorkspaceUi,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import type {
  VoicePresenceItem,
  WorkspaceResult,
} from "@/components/workspace/workspace-types";
import { getDisplayName, getInitials } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import { getChannelPath, getDmPath, getServerPath } from "@/lib/workspace";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const SIDEBAR_RAIL_TONES = [
  "from-sky-500 to-cyan-400",
  "from-fuchsia-500 to-pink-500",
  "from-emerald-500 to-lime-400",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-indigo-500",
  "from-rose-500 to-red-500",
] as const;

const RECENT_SEARCHES_STORAGE_KEY = "opencord:command-palette-recents";
const MAX_RECENT_SEARCHES = 30;
const DEFAULT_RECENT_RESULTS = 7;
const MAX_VISIBLE_RESULTS = 10;

interface DiscordDmRowProps {
  active?: boolean;
  avatarUrl?: string | null;
  displayName: string;
  onClick: () => void;
  presence?: "active" | "idle";
  subtitle: string;
}

interface SearchCommandItem {
  id: string;
  kind: "dm" | "text" | "voice";
  label: string;
  path: string;
  searchText: string;
  subtitle: string;
}

interface RecentSearchItem {
  itemId: string;
  updatedAt: number;
}

function readRecentSearches() {
  if (typeof window === "undefined") {
    return [] as RecentSearchItem[];
  }

  try {
    const storedValue = window.localStorage.getItem(
      RECENT_SEARCHES_STORAGE_KEY
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue) as RecentSearchItem[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(recentItems: RecentSearchItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(recentItems.slice(0, MAX_RECENT_SEARCHES))
  );
}

function trackRecentSearch(itemId: string) {
  const nextItems = [
    { itemId, updatedAt: Date.now() },
    ...readRecentSearches().filter((item) => item.itemId !== itemId),
  ];

  writeRecentSearches(nextItems);
}

export function WorkspaceRail() {
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const navigation = useWorkspaceNavigation();

  return (
    <div className="flex w-[76px] shrink-0 flex-col items-center justify-between border-white/5 border-r bg-[#1e1f22] px-3 py-4">
      <div className="flex flex-col items-center gap-3">
        <Tooltip>
          <TooltipTrigger
            onClick={() => navigation.navigate("/channels")}
            render={
              <Button
                className={cn(
                  "size-12 rounded-[1.35rem] border border-white/5 bg-[#5865f2] text-white shadow-[0_10px_30px_rgba(88,101,242,0.35)] hover:bg-[#6d78f6]",
                  view.isFriendsView &&
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
            onClick={() => ui.setIsCreateServerOpen(true)}
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
    <aside className="flex h-full flex-col border-white/5 border-r bg-[#2b2d31]">
      {view.isFriendsView ? (
        <div className="border-white/6 border-b p-3">
          <WorkspaceSearchPalette />
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
                    ? "bg-[#404249] text-white"
                    : "text-[#b5bac1] hover:bg-[#35373c] hover:text-[#eceef2]"
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
                <div className="font-semibold text-[#b5bac1] text-sm">
                  Direct Messages
                </div>
                <button
                  className="rounded-md p-1 text-[#b5bac1] transition-colors hover:bg-[#35373c] hover:text-white"
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
                      {view.activeServer?.name ?? "Server"}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[#a7aab4] text-sm">
                      {view.activeServer?.description ||
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
              {view.isFriendsView
                ? `${directMessageCount} open DMs`
                : (view.activeServer?.name ?? "OpenCord")}
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
            <ChevronDownIcon className="size-4 text-white/80" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function WorkspaceSearchPalette() {
  const view = useWorkspaceView();
  const navigation = useWorkspaceNavigation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentItems, setRecentItems] =
    useState<RecentSearchItem[]>(readRecentSearches);

  const workspaceQueries = useMemo<RequestForQueries>(() => {
    const entries = (view.servers ?? []).flatMap((entry) =>
      entry.server
        ? [
            [
              entry.server._id,
              {
                args: { serverId: entry.server._id },
                query: api.servers.getWorkspace,
              },
            ] as const,
          ]
        : []
    );

    return Object.fromEntries(entries);
  }, [view.servers]);

  const workspaceResults = useQueries(workspaceQueries);

  const dmItems = useMemo<SearchCommandItem[]>(
    () =>
      (view.conversations ?? [])
        .map((conversation) => {
          const displayName = getDisplayName(conversation.otherUser);
          const latestMessage = conversation.latestMessage?.body ?? "";
          const handle = conversation.otherUser?.handle ?? "";

          return {
            id: `dm:${conversation._id}`,
            kind: "dm",
            label: displayName,
            path: getDmPath(conversation._id),
            searchText: `${displayName} ${handle} ${latestMessage} dm conversation`,
            subtitle: latestMessage || "Direct message",
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label)),
    [view.conversations]
  );

  const channelItems = useMemo<SearchCommandItem[]>(() => {
    const workspaces = Object.values(workspaceResults).filter(
      (result): result is WorkspaceResult =>
        typeof result !== "undefined" && !(result instanceof Error)
    );

    return workspaces
      .flatMap((workspace) => {
        const serverName = workspace.server?.name ?? "Server";

        return workspace.channels.map((channel) => ({
          id: `channel:${channel._id}`,
          kind: channel.kind,
          label: channel.kind === "text" ? `#${channel.name}` : channel.name,
          path: getChannelPath(channel.serverId, channel._id),
          searchText: `${channel.name} ${serverName} ${channel.kind} ${channel.access} channel`,
          subtitle: `${serverName} | ${channel.kind}`,
        }));
      })
      .sort(
        (left, right) =>
          left.subtitle.localeCompare(right.subtitle) ||
          left.label.localeCompare(right.label)
      );
  }, [workspaceResults]);

  const allItems = useMemo(
    () => [...dmItems, ...channelItems],
    [channelItems, dmItems]
  );

  const itemMap = useMemo(
    () => new Map(allItems.map((item) => [item.id, item])),
    [allItems]
  );

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        ignoreLocation: true,
        keys: ["label", "subtitle", "searchText"],
        threshold: 0.35,
      }),
    [allItems]
  );

  const recentResults = useMemo(
    () =>
      recentItems
        .map((recentItem) => itemMap.get(recentItem.itemId))
        .filter((item): item is SearchCommandItem => Boolean(item))
        .slice(0, DEFAULT_RECENT_RESULTS),
    [itemMap, recentItems]
  );

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return recentResults;
    }

    return fuse
      .search(normalizedQuery)
      .map((result) => result.item)
      .slice(0, MAX_VISIBLE_RESULTS);
  }, [fuse, query, recentResults]);

  const dmResults = useMemo(
    () => searchResults.filter((item) => item.kind === "dm"),
    [searchResults]
  );

  const channelResults = useMemo(
    () => searchResults.filter((item) => item.kind !== "dm"),
    [searchResults]
  );
  const hasQuery = query.trim().length > 0;
  const showRecentResults = !hasQuery && recentResults.length > 0;

  const openItem = (item: SearchCommandItem) => {
    trackRecentSearch(item.id);
    setRecentItems(readRecentSearches());
    navigation.navigate(item.path);
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }

      if (event.key.toLowerCase() !== "k") {
        return;
      }

      event.preventDefault();
      setOpen((currentValue) => !currentValue);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecentItems(readRecentSearches());
    }
  }, [open]);

  useEffect(() => {
    if (!view.activeConversation) {
      return;
    }

    trackRecentSearch(`dm:${view.activeConversation._id}`);
    setRecentItems(readRecentSearches());
  }, [view.activeConversation]);

  useEffect(() => {
    if (!(view.activeChannel && view.activeServer)) {
      return;
    }

    trackRecentSearch(`channel:${view.activeChannel._id}`);
    setRecentItems(readRecentSearches());
  }, [view.activeChannel, view.activeServer]);

  return (
    <>
      <button
        className="flex h-10 w-full items-center gap-2 rounded-xl border border-white/6 bg-[#1e1f22] px-3 text-left font-medium text-[#b5bac1] text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-white/10 hover:text-[#f2f3f5]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <SearchIcon className="size-4 shrink-0 text-[#8e9297]" />
        <span className="flex-1 truncate">
          {view.isFriendsView
            ? "Find conversation or channel"
            : `Jump anywhere in ${view.workspace?.server?.name ?? "workspace"}`}
        </span>
      </button>

      <CommandDialog
        className="border-white/8 bg-[#1e1f22] sm:max-w-2xl"
        description="Client-side fuzzy search across your loaded DMs and channels."
        onOpenChange={setOpen}
        open={open}
        overlayClassName="bg-black/55 supports-backdrop-filter:backdrop-blur-none"
        title="Find conversations and channels"
      >
        <Command className="bg-[#1e1f22] text-[#f2f3f5]" shouldFilter={false}>
          <CommandInput
            className="placeholder:text-[#8e9297]"
            onValueChange={setQuery}
            placeholder="Search DMs, text channels, voice channels..."
            value={query}
          />
          <CommandList className="max-h-[24rem]">
            {searchResults.length ? null : (
              <CommandEmpty>No conversations or channels found.</CommandEmpty>
            )}
            {showRecentResults ? (
              <CommandGroup heading="Recent">
                {recentResults.map((item) => (
                  <PaletteItem item={item} key={item.id} onSelect={openItem} />
                ))}
              </CommandGroup>
            ) : null}
            {hasQuery && dmResults.length ? (
              <CommandGroup heading="Direct Messages">
                {dmResults.map((item) => (
                  <PaletteItem item={item} key={item.id} onSelect={openItem} />
                ))}
              </CommandGroup>
            ) : null}
            {hasQuery && channelResults.length ? (
              <CommandGroup heading="Channels">
                {channelResults.map((item) => (
                  <PaletteItem item={item} key={item.id} onSelect={openItem} />
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function PaletteItem({
  item,
  onSelect,
}: {
  item: SearchCommandItem;
  onSelect: (item: SearchCommandItem) => void;
}) {
  let shortcut = "Text";
  let icon = <HashIcon className="text-[#8e9297]" />;

  if (item.kind === "dm") {
    shortcut = "DM";
    icon = <MessageSquareIcon className="text-[#8e9297]" />;
  } else if (item.kind === "voice") {
    shortcut = "Voice";
    icon = <Volume2Icon className="text-[#8e9297]" />;
  }

  return (
    <CommandItem
      className="gap-3 rounded-xl px-3 py-2"
      onSelect={() => onSelect(item)}
      value={item.searchText}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-[#f2f3f5] text-sm">
          {item.label}
        </div>
        <div className="truncate text-[#8e9297] text-xs">{item.subtitle}</div>
      </div>
      <CommandShortcut>{shortcut}</CommandShortcut>
    </CommandItem>
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
