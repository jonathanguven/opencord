import { useLayoutEffect, useRef } from "react";

import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";

const MAX_MESSAGE_BOX_LINES = 24;

interface MessageBoxProps {
  draft: string;
  onChange: (value: string) => void;
  onEditLatestMessage: () => boolean;
  onSend: () => void;
  placeholder: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function MessageBox({
  draft,
  onChange,
  onEditLatestMessage,
  onSend,
  placeholder,
  textareaRef,
}: MessageBoxProps) {
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
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
    <InputGroup className="min-h-0 items-end rounded-2xl">
      <InputGroupTextarea
        className="min-h-0 overflow-y-hidden px-3 py-3 leading-6"
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
        placeholder={placeholder}
        ref={composerRef}
        rows={1}
        value={draft}
      />
    </InputGroup>
  );
}
