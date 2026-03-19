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
import { MessageMarkdown } from "@/components/workspace/message-markdown";
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
const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

const TODAY_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const HISTORICAL_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const FULL_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

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
  onDeleteMessageImage: (messageId: MessageListItem["_id"]) => void;
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
  onDeleteMessageImage,
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
      <div className="flex min-h-full flex-col justify-end py-3">
        <div className="flex flex-col gap-2.5">
          {MESSAGE_SKELETON_KEYS.map((key) => (
            <div className="flex gap-2 px-4 pr-5" key={key}>
              <Skeleton className="size-10 rounded-full" />
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
    <div className="flex min-h-full flex-col justify-end py-3">
      <div className="flex flex-col">
        {messages.map((message, index) => (
          <MessageFeedItem
            composerRef={composerRef}
            currentUserId={currentUserId}
            editingDraft={editingDraft}
            editingMessageId={editingMessageId}
            editingTextareaRef={editingTextareaRef}
            key={message._id}
            message={message}
            onCancelEdit={onCancelEdit}
            onChangeEditingDraft={onChangeEditingDraft}
            onDeleteMessage={onDeleteMessage}
            onDeleteMessageImage={onDeleteMessageImage}
            onEditMessage={onEditMessage}
            onSubmitEdit={onSubmitEdit}
            previousMessage={messages[index - 1]}
          />
        ))}
      </div>
    </div>
  );
}

interface MessageFeedItemProps {
  composerRef?: React.RefObject<HTMLTextAreaElement | null>;
  currentUserId?: string | null;
  editingDraft: string;
  editingMessageId?: string | null;
  editingTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  message: MessageListItem;
  onCancelEdit: () => void;
  onChangeEditingDraft: (value: string) => void;
  onDeleteMessage: (messageId: MessageListItem["_id"]) => void;
  onDeleteMessageImage: (messageId: MessageListItem["_id"]) => void;
  onEditMessage: (messageId: MessageListItem["_id"]) => void;
  onSubmitEdit: () => void;
  previousMessage: MessageListItem | undefined;
}

function MessageFeedItem({
  composerRef,
  currentUserId,
  editingDraft,
  editingMessageId,
  editingTextareaRef,
  message,
  onCancelEdit,
  onChangeEditingDraft,
  onDeleteMessage,
  onDeleteMessageImage,
  onEditMessage,
  onSubmitEdit,
  previousMessage,
}: MessageFeedItemProps) {
  const isGrouped = shouldGroupWithPrevious(previousMessage, message);
  const isEditing = editingMessageId === message._id;
  const isOwnMessage = message.authorId === currentUserId;
  const hasPreviousMessage = typeof previousMessage !== "undefined";

  return (
    <div
      className={`group relative w-full cursor-default hover:bg-white/5 ${
        isGrouped ? "min-h-[22px] py-0" : "py-1.5"
      } ${hasPreviousMessage && !isGrouped ? "mt-2" : ""}`}
    >
      {isOwnMessage ? (
        <MessageActions
          message={message}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
        />
      ) : null}
      {isGrouped ? (
        <div className="relative w-full pr-5 pl-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex w-[52px] items-center justify-center text-[11px] text-muted-foreground/70 leading-[22px] opacity-0 group-hover:opacity-100"
          >
            <span
              className="whitespace-nowrap text-center"
              title={formatTimestampTitle(message.createdAt)}
            >
              {TODAY_TIME_FORMATTER.format(message.createdAt)}
            </span>
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <div className="mt-1 flex w-full flex-col gap-2">
                <Textarea
                  autoFocus
                  className="min-h-11 w-full resize-none rounded-md border-border/60 bg-background/40 px-3 py-2 shadow-none focus-visible:border-border/80 focus-visible:ring-0"
                  maxLength={4000}
                  onChange={(event) => onChangeEditingDraft(event.target.value)}
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
              <MessageContent
                currentUserId={currentUserId}
                isGrouped={isGrouped}
                message={message}
                onDeleteMessageImage={onDeleteMessageImage}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex w-full items-start gap-2 pr-5 pl-4">
          <Avatar className="size-10">
            <AvatarImage src={message.author?.avatarUrl ?? undefined} />
            <AvatarFallback>
              {getInitials(getDisplayName(message.author))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <MessageHeader message={message} />
            {isEditing ? (
              <div className="mt-1 flex w-full flex-col gap-2">
                <Textarea
                  autoFocus
                  className="min-h-11 w-full resize-none rounded-md border-border/60 bg-background/40 px-3 py-2 shadow-none focus-visible:border-border/80 focus-visible:ring-0"
                  maxLength={4000}
                  onChange={(event) => onChangeEditingDraft(event.target.value)}
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
              <MessageContent
                currentUserId={currentUserId}
                isGrouped={isGrouped}
                message={message}
                onDeleteMessageImage={onDeleteMessageImage}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageActionsProps {
  message: MessageListItem;
  onDeleteMessage: (messageId: MessageListItem["_id"]) => void;
  onEditMessage: (messageId: MessageListItem["_id"]) => void;
}

function MessageActions({
  message,
  onDeleteMessage,
  onEditMessage,
}: MessageActionsProps) {
  return (
    <div className="absolute top-0 right-1 z-10 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border/70 bg-muted/95 p-1 opacity-0 shadow-sm group-focus-within:opacity-100 group-hover:opacity-100">
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
  );
}

function MessageHeader({ message }: { message: MessageListItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-sm">
        {getDisplayName(message.author)}
      </span>
      <span
        className="text-muted-foreground text-xs"
        title={formatTimestampTitle(message.createdAt)}
      >
        {formatTimestampLabel(message.createdAt)}
      </span>
    </div>
  );
}

interface MessageContentProps {
  currentUserId?: string | null;
  isGrouped: boolean;
  message: MessageListItem;
  onDeleteMessageImage: (messageId: MessageListItem["_id"]) => void;
}

function MessageContent({
  currentUserId,
  isGrouped,
  message,
  onDeleteMessageImage,
}: MessageContentProps) {
  return (
    <div
      className={isGrouped ? "flex flex-col gap-0" : "mt-1 flex flex-col gap-2"}
    >
      {message.body ? (
        <div>
          <MessageMarkdown
            body={message.body}
            className={isGrouped ? "leading-[22px]" : undefined}
          />
          {message.editedAt ? (
            <span className="ml-1.5 inline-block text-[11px] text-muted-foreground/80">
              (edited)
            </span>
          ) : null}
        </div>
      ) : null}
      {message.imageUrl ? (
        <div className="group/image relative w-fit max-w-full">
          <img
            alt={`Uploaded by ${getDisplayName(message.author)}`}
            className="max-h-80 max-w-full rounded-lg border border-border/60 bg-muted/20 object-cover"
            height={720}
            loading="lazy"
            src={message.imageUrl}
            width={1280}
          />
          {message.authorId === currentUserId && message.body.trim() ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Delete image attachment"
                    className="absolute top-2 right-2 size-8 rounded-md bg-muted/95 text-white opacity-0 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-destructive hover:text-white group-hover/image:opacity-100"
                    onClick={() => onDeleteMessageImage(message._id)}
                    size="icon"
                    type="button"
                    variant="plain"
                  />
                }
              >
                <Trash2Icon className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Delete image</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
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

function shouldGroupWithPrevious(
  previousMessage: MessageListItem | undefined,
  currentMessage: MessageListItem
) {
  if (!previousMessage) {
    return false;
  }

  if (previousMessage.authorId !== currentMessage.authorId) {
    return false;
  }

  if (!isSameCalendarDay(previousMessage.createdAt, currentMessage.createdAt)) {
    return false;
  }

  return (
    currentMessage.createdAt - previousMessage.createdAt <=
    MESSAGE_GROUP_WINDOW_MS
  );
}

function formatTimestampLabel(value: number) {
  const timestamp = new Date(value);
  const now = new Date();

  if (isSameCalendarDay(value, now.getTime())) {
    return TODAY_TIME_FORMATTER.format(timestamp);
  }

  if (isYesterday(timestamp, now)) {
    return "Yesterday";
  }

  return HISTORICAL_TIMESTAMP_FORMATTER.format(timestamp);
}

function formatTimestampTitle(value: number) {
  return FULL_TIMESTAMP_FORMATTER.format(value);
}

function isSameCalendarDay(leftValue: number, rightValue: number) {
  const left = new Date(leftValue);
  const right = new Date(rightValue);

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isYesterday(value: Date, now: Date) {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfValueDay = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate()
  );

  return (
    startOfToday.getTime() - startOfValueDay.getTime() === 24 * 60 * 60 * 1000
  );
}
