import { MessageCircleIcon } from "lucide-react";
import { useRef } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBox } from "@/components/workspace/message-box";
import { useWorkspaceThread } from "@/components/workspace/workspace-screen-context";
import { MessageFeed } from "@/pages/workspace-page-parts";
import type { Doc } from "../../../convex/_generated/dataModel";

interface VoiceChannelChatSidebarProps {
  channel: Doc<"channels">;
  currentUserId?: string | null;
}

export function VoiceChannelChatSidebar({
  channel,
  currentUserId,
}: VoiceChannelChatSidebarProps) {
  const thread = useWorkspaceThread();
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border/60 border-b px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-sm">
          <MessageCircleIcon className="size-4 text-muted-foreground" />
          Voice Chat
        </div>
        <div className="truncate text-muted-foreground text-xs">
          Only visible while you are in {channel.name}.
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <MessageFeed
          composerRef={composerRef}
          currentUserId={currentUserId}
          editingDraft={thread.editingMessageDraft}
          editingMessageId={thread.editingMessageId}
          emptyDescription={`Say something in ${channel.name}'s side chat.`}
          emptyTitle="No voice chat messages yet"
          messages={thread.messages}
          onCancelEdit={thread.cancelEditingMessage}
          onChangeEditingDraft={thread.setEditingMessageDraft}
          onDeleteMessage={thread.deleteOwnMessage}
          onEditMessage={thread.editOwnMessage}
          onSubmitEdit={thread.submitEditingMessage}
        />
      </ScrollArea>

      <div className="border-border/60 border-t px-3 py-2.5">
        <MessageBox
          draft={thread.messageDraft}
          onChange={thread.setMessageDraft}
          onEditLatestMessage={thread.editLatestOwnMessage}
          onSend={thread.sendActiveMessage}
          placeholder={`Message ${channel.name} voice chat`}
          textareaRef={composerRef}
        />
      </div>
    </div>
  );
}
