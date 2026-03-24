import { type RequestForQueries, useQueries } from "convex/react";
import Fuse from "fuse.js";
import { HashIcon, Volume2Icon } from "lucide-react";
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
  useWorkspaceNavigation,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import type { WorkspaceResult } from "@/components/workspace/workspace-types";
import { getChannelNameText } from "@/lib/channel-name";
import { getMessagePreview } from "@/lib/message-preview";
import { getDisplayName, getInitials } from "@/lib/presentation";
import { getChannelPath, getDmPath } from "@/lib/workspace";
import { api } from "../../../convex/_generated/api";

const RECENT_SEARCHES_STORAGE_KEY = "opencord:command-palette-recents";
const OPEN_COMMAND_PALETTE_EVENT = "opencord:open-command-palette";
const MAX_RECENT_SEARCHES = 30;
const DEFAULT_RECENT_RESULTS = 7;
const MAX_VISIBLE_RESULTS = 10;

interface SearchCommandItem {
  avatarUrl?: string | null;
  handle?: string;
  id: string;
  kind: "dm" | "text" | "voice";
  label: string;
  path: string;
  searchText: string;
  serverName?: string;
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

export function WorkspaceCommandPalette() {
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
          const latestMessage = getMessagePreview(conversation.latestMessage);
          const handle = conversation.otherUser?.handle ?? "";

          return {
            avatarUrl: conversation.otherUser?.avatarUrl ?? null,
            handle,
            id: `dm:${conversation._id}`,
            kind: "dm" as const,
            label: displayName,
            path: getDmPath(conversation._id),
            searchText: `${displayName} ${handle} ${latestMessage} dm conversation`,
            subtitle: "",
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
          label: getChannelNameText(channel),
          path: getChannelPath(channel.serverId, channel._id),
          searchText: `${channel.name} ${serverName} ${channel.kind} ${channel.access} channel`,
          serverName,
          subtitle: serverName,
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
    const handleOpenCommandPalette = () => {
      setOpen(true);
    };

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

    window.addEventListener(
      OPEN_COMMAND_PALETTE_EVENT,
      handleOpenCommandPalette
    );
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener(
        OPEN_COMMAND_PALETTE_EVENT,
        handleOpenCommandPalette
      );
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecentItems(readRecentSearches());
    }
  }, [open]);

  useEffect(() => {
    const activeConversationId = view.activeConversation?._id;

    if (!activeConversationId) {
      return;
    }

    trackRecentSearch(`dm:${activeConversationId}`);
    setRecentItems(readRecentSearches());
  }, [view.activeConversation?._id]);

  useEffect(() => {
    const activeChannelId = view.activeChannel?._id;
    const activeServerId = view.activeServer?._id;

    if (!(activeChannelId && activeServerId)) {
      return;
    }

    trackRecentSearch(`channel:${activeChannelId}`);
    setRecentItems(readRecentSearches());
  }, [view.activeChannel?._id, view.activeServer?._id]);

  return (
    <CommandDialog
      className="border-sidebar-border bg-popover sm:max-w-2xl"
      description="Client-side fuzzy search across your loaded DMs and channels."
      onOpenChange={setOpen}
      open={open}
      title="Find conversations and channels"
    >
      <Command
        className="bg-popover text-popover-foreground"
        loop
        shouldFilter={false}
      >
        <CommandInput
          className="placeholder:text-muted-foreground"
          onValueChange={setQuery}
          placeholder="Search DMs, text channels, voice channels..."
          value={query}
        />
        <CommandList className="max-h-96">
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
  );
}

export function WorkspaceCommandPaletteTrigger() {
  return (
    <Button
      className="h-9 w-full justify-start gap-2 rounded-lg border-sidebar-border bg-input px-2.5 text-left font-medium text-[0.92rem] text-muted-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.03)] hover:border-ring/30 hover:text-foreground"
      onClick={() =>
        window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))
      }
      type="button"
      variant="plain"
    >
      <span className="flex-1 truncate text-center">Find DM or channel</span>
    </Button>
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
  let icon = <HashIcon className="text-muted-foreground" />;
  let rightContent: ReactNode = <CommandShortcut>{shortcut}</CommandShortcut>;
  let labelSuffix: ReactNode = null;
  let subtitle = item.subtitle;

  if (item.kind === "dm") {
    icon = (
      <Avatar className="size-6">
        <AvatarImage src={item.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-primary/20 text-primary-foreground">
          {getInitials(item.label)}
        </AvatarFallback>
      </Avatar>
    );
    shortcut = item.handle ? `@${item.handle}` : "";
    labelSuffix = shortcut ? (
      <span className="truncate text-muted-foreground text-xs">{shortcut}</span>
    ) : null;
    rightContent = null;
  } else if (item.kind === "voice") {
    shortcut = "Voice";
    icon = <Volume2Icon className="text-muted-foreground" />;
    rightContent = <CommandShortcut>{shortcut}</CommandShortcut>;
  } else {
    subtitle = "";
    shortcut = item.serverName ?? "";
    rightContent = <CommandShortcut>{shortcut}</CommandShortcut>;
  }

  return (
    <CommandItem
      className="gap-3 rounded-xl px-3 py-2"
      onSelect={() => onSelect(item)}
      value={item.searchText}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 truncate">
          <span className="truncate font-medium text-foreground text-sm">
            {item.label}
          </span>
          {labelSuffix}
        </div>
        {subtitle ? (
          <div className="truncate text-muted-foreground text-xs">
            {subtitle}
          </div>
        ) : null}
      </div>
      {rightContent}
    </CommandItem>
  );
}
