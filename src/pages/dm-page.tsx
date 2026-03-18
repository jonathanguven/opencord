import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useWorkspaceThread,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import { getDisplayName } from "@/lib/presentation";
import {
  MessageComposer,
  MessageFeed,
  ThreadLoadingState,
} from "./workspace-page-parts";

export function DmPage() {
  const view = useWorkspaceView();
  const thread = useWorkspaceThread();

  const activeConversation = view.activeConversation;

  if (!activeConversation) {
    return view.activeConversationId ? <ThreadLoadingState /> : null;
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <MessageFeed
          emptyDescription={`Start the conversation with ${getDisplayName(
            activeConversation.otherUser
          )}.`}
          emptyTitle="Say hello"
          messages={thread.messages}
        />
      </ScrollArea>
      <div className="border-border/60 border-t p-4">
        <MessageComposer
          draft={thread.messageDraft}
          onChange={thread.setMessageDraft}
          onSend={thread.sendActiveMessage}
          placeholder={`Message ${getDisplayName(activeConversation.otherUser)}`}
        />
      </div>
    </div>
  );
}
