import { MessageSquareIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  composerRef?: React.RefObject<HTMLTextAreaElement | null>;
  currentUserId?: string | null;
  editingDraft: string;
  editingMessageId?: string | null;
  emptyDescription: string;
  emptyTitle: string;
  messages: MessageListItem[] | undefined;
  onCancelEdit: () => void;
  onChangeEditingDraft: (value: string) => void;
  onDeleteMessage: (messageId: MessageListItem["_id"]) => void;
  onEditMessage: (messageId: MessageListItem["_id"]) => void;
  onSubmitEdit: () => void;
}

export function MessageFeed({
  composerRef,
  currentUserId,
  editingDraft,
  editingMessageId,
  emptyDescription,
  emptyTitle,
  messages,
  onCancelEdit,
  onChangeEditingDraft,
  onDeleteMessage,
  onEditMessage,
  onSubmitEdit,
}: MessageFeedProps) {
  const shouldShowLoadingSkeleton = useDelayedLoadingState(
    typeof messages === "undefined",
    MESSAGE_LOADING_SKELETON_DELAY_MS
  );
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!(editingMessageId && editingTextareaRef.current)) {
      return;
    }

    const textarea = editingTextareaRef.current;
    const caretPosition = textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(caretPosition, caretPosition);
  }, [editingMessageId]);

  if (!messages) {
    if (!shouldShowLoadingSkeleton) {
      return <div className="h-full" />;
    }

    return (
      <div className="flex min-h-full flex-col justify-end p-3">
        <div className="flex flex-col gap-2.5">
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
    <div className="flex min-h-full flex-col justify-end p-3">
      <div className="flex flex-col gap-2">
        {messages.map((message) => (
          <div
            className="group relative -mx-3 flex cursor-default gap-2.5 px-4 py-1.5 transition-colors hover:bg-white/5"
            key={message._id}
          >
            {message.authorId === currentUserId ? (
              <div className="absolute top-0 right-1 z-10 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border/70 bg-muted/95 p-1 opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        aria-label="Edit message"
                        className="group/edit size-7 rounded-md text-muted-foreground transition-all hover:scale-105 hover:bg-background/80 hover:text-foreground"
                        onClick={() => onEditMessage(message._id)}
                        size="icon-sm"
                        type="button"
                        variant="plain"
                      />
                    }
                  >
                    <PencilIcon className="size-3.5 transition-all group-hover/edit:scale-110 group-hover/edit:stroke-[2.4]" />
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        aria-label="Delete message"
                        className="group/delete size-7 rounded-md text-destructive transition-all hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteMessage(message._id)}
                        size="icon-sm"
                        type="button"
                        variant="plain"
                      />
                    }
                  >
                    <Trash2Icon className="size-3.5 transition-all group-hover/delete:scale-110 group-hover/delete:stroke-[2.4]" />
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            ) : null}
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
              {editingMessageId === message._id ? (
                <div className="mt-1 flex w-full flex-col gap-2">
                  <Textarea
                    autoFocus
                    className="min-h-11 w-full resize-none rounded-md border-border/60 bg-background/40 px-3 py-2 shadow-none focus-visible:border-border/80 focus-visible:ring-0"
                    maxLength={4000}
                    onChange={(event) =>
                      onChangeEditingDraft(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        onCancelEdit();
                        composerRef?.current?.focus();
                        return;
                      }

                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        const submitResult = onSubmitEdit();
                        Promise.resolve(submitResult).finally(() => {
                          composerRef?.current?.focus();
                        });
                      }
                    }}
                    ref={editingTextareaRef}
                    rows={1}
                    value={editingDraft}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    esc to cancel, enter to save
                  </span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-foreground/95 text-sm leading-5">
                  <span>{message.body}</span>
                  {message.editedAt ? (
                    <span className="ml-1.5 inline-block text-[11px] text-muted-foreground/80">
                      (edited)
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
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
