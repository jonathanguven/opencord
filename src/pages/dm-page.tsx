import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ConversationListItem,
  MessageListItem,
} from "@/components/workspace/workspace-types";
import { getDisplayName } from "@/lib/presentation";
import {
  MessageComposer,
  MessageFeed,
  ThreadLoadingState,
} from "./workspace-page-parts";

interface DmPageProps {
  activeConversation: ConversationListItem | null;
  activeConversationId: ConversationListItem["_id"] | null;
  messageDraft: string;
  messages: MessageListItem[] | undefined;
  onChangeDraft: (value: string) => void;
  onSendMessage: () => void;
}

export function DmPage({
  activeConversation,
  activeConversationId,
  messageDraft,
  messages,
  onChangeDraft,
  onSendMessage,
}: DmPageProps) {
  if (!activeConversation) {
    return activeConversationId ? <ThreadLoadingState /> : null;
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <MessageFeed
          emptyDescription={`Start the conversation with ${getDisplayName(
            activeConversation.otherUser
          )}.`}
          emptyTitle="Say hello"
          messages={messages}
        />
      </ScrollArea>
      <div className="border-border/60 border-t p-4">
        <MessageComposer
          draft={messageDraft}
          onChange={onChangeDraft}
          onSend={onSendMessage}
          placeholder={`Message ${getDisplayName(activeConversation.otherUser)}`}
        />
      </div>
    </div>
  );
}
