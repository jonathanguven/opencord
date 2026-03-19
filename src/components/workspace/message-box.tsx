import { FileUpIcon, PlusIcon, XIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import type { PendingMessageImage } from "@/components/workspace/workspace-types";

const MAX_MESSAGE_BOX_LINES = 24;

interface MessageBoxProps {
  attachment?: PendingMessageImage | null;
  draft: string;
  onChange: (value: string) => void;
  onEditLatestMessage: () => boolean;
  onRemoveAttachment: () => void;
  onSend: () => void;
  onUploadImage: (file: File) => void | Promise<void>;
  placeholder: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function MessageBox({
  attachment,
  draft,
  onChange,
  onEditLatestMessage,
  onRemoveAttachment,
  onSend,
  onUploadImage,
  placeholder,
  textareaRef,
}: MessageBoxProps) {
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = textareaRef ?? internalTextareaRef;

  useLayoutEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight);
    const paddingHeight =
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom);
    const borderHeight =
      Number.parseFloat(styles.borderTopWidth) +
      Number.parseFloat(styles.borderBottomWidth);
    const maxHeight =
      lineHeight * MAX_MESSAGE_BOX_LINES + paddingHeight + borderHeight;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  });

  return (
    <div className="flex flex-col gap-2">
      <input
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];
          if (!nextFile) {
            return;
          }

          Promise.resolve(onUploadImage(nextFile)).catch(() => undefined);
          event.target.value = "";
        }}
        ref={fileInputRef}
        type="file"
      />
      {attachment ? (
        <div className="inline-flex max-w-full items-center gap-3 self-start rounded-2xl border border-border/70 bg-muted/30 p-2.5">
          <img
            alt={attachment.fileName}
            className="size-14 rounded-xl object-cover"
            height={56}
            src={attachment.previewUrl}
            width={56}
          />
          <div className="min-w-0">
            <div className="truncate font-medium text-sm">
              {attachment.fileName}
            </div>
            <div className="text-muted-foreground text-xs">
              {attachment.isUploading ? "Uploading image..." : "Ready to send"}
            </div>
          </div>
          <Button
            aria-label="Remove image attachment"
            onClick={onRemoveAttachment}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>
      ) : null}
      <InputGroup className="min-h-0 items-end overflow-hidden rounded-2xl">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="Add attachment"
                className="mb-1 ml-1 size-10 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
                size="icon"
                type="button"
                variant="plain"
              />
            }
          >
            <PlusIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 rounded-2xl border border-border/70 bg-popover p-2"
            side="top"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="min-h-11 gap-3 rounded-xl px-3 py-2 text-base"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUpIcon />
                Upload a File
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <InputGroupTextarea
          className="field-sizing-fixed min-h-0 overflow-y-hidden px-3 py-3 leading-6"
          maxLength={4000}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "ArrowUp" &&
              !event.shiftKey &&
              !draft.trim() &&
              event.currentTarget.selectionStart === 0 &&
              event.currentTarget.selectionEnd === 0
            ) {
              if (onEditLatestMessage()) {
                event.preventDefault();
              }
              return;
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          onPaste={(event) => {
            const imageItem = [...event.clipboardData.items].find((item) =>
              item.type.startsWith("image/")
            );
            const file = imageItem?.getAsFile();
            if (!file) {
              return;
            }

            event.preventDefault();
            Promise.resolve(onUploadImage(file)).catch(() => undefined);
          }}
          placeholder={placeholder}
          ref={composerRef}
          rows={1}
          value={draft}
        />
      </InputGroup>
    </div>
  );
}
