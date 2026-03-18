import { ChevronRightIcon, MessageSquareIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageListItem } from "@/components/workspace/workspace-types";
import { getDisplayName, getInitials } from "@/lib/presentation";

const MESSAGE_SKELETON_KEYS = [
  "message-skeleton-1",
  "message-skeleton-2",
  "message-skeleton-3",
  "message-skeleton-4",
  "message-skeleton-5",
  "message-skeleton-6",
  "message-skeleton-7",
  "message-skeleton-8",
] as const;

const MESSAGE_LOADING_SKELETON_DELAY_MS = 1000;

interface MessageFeedProps {
  emptyDescription: string;
  emptyTitle: string;
  messages: MessageListItem[] | undefined;
}

interface MessageComposerProps {
  draft: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
}

export function MessageFeed({
  emptyDescription,
  emptyTitle,
  messages,
}: MessageFeedProps) {
  const shouldShowLoadingSkeleton = useDelayedLoadingState(
    typeof messages === "undefined",
    MESSAGE_LOADING_SKELETON_DELAY_MS
  );

  if (!messages) {
    if (!shouldShowLoadingSkeleton) {
      return <div className="h-full" />;
    }

    return (
      <div className="flex flex-col gap-2.5 p-3">
        {MESSAGE_SKELETON_KEYS.map((key) => (
          <div className="flex gap-2.5" key={key}>
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Empty className="max-w-xl border-border/60 bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {messages.map((message) => (
        <div
          className="flex gap-2.5 rounded-xl border border-transparent px-1 py-1.5 hover:border-border/50 hover:bg-muted/20"
          key={message._id}
        >
          <Avatar className="size-9">
            <AvatarImage src={message.author?.avatarUrl ?? undefined} />
            <AvatarFallback>
              {getInitials(getDisplayName(message.author))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">
                {getDisplayName(message.author)}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatTimestamp(message.createdAt)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-foreground/95 text-sm leading-5">
              {message.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function useDelayedLoadingState(isLoading: boolean, delayMs: number) {
  const [isDelayElapsed, setIsDelayElapsed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsDelayElapsed(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsDelayElapsed(true);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, isLoading]);

  return isLoading && isDelayElapsed;
}

export function MessageComposer({
  draft,
  onChange,
  onSend,
  placeholder,
}: MessageComposerProps) {
  return (
    <InputGroup className="min-h-12 items-end">
      <InputGroupTextarea
        maxLength={4000}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
        rows={1}
        value={draft}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          disabled={!draft.trim()}
          onClick={onSend}
          size="icon-sm"
        >
          <ChevronRightIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function ThreadLoadingState() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="min-h-0 flex-1 rounded-3xl" />
    </div>
  );
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(value);
}
