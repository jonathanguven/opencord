import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBox } from "@/components/workspace/message-box";
import { VoiceChannelPanel } from "@/components/workspace/voice-channel-panel";
import {
  useWorkspaceCall,
  useWorkspaceThread,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import { getChannelDisplayName } from "@/lib/channel-name";
import { MessageFeed, ThreadLoadingState } from "@/pages/workspace-page-parts";

export function ServerChannelPage() {
  const view = useWorkspaceView();
  const thread = useWorkspaceThread();
  const call = useWorkspaceCall();
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const activeChannel = view.activeChannel;
  const activeChannelId = activeChannel?._id ?? null;
  const isActiveTextChannel = activeChannel?.kind === "text";

  useEffect(() => {
    if (!(activeChannelId && isActiveTextChannel)) {
      return;
    }

    const composer = composerRef.current;
    if (!composer) {
      return;
    }

    composer.focus({ preventScroll: true });
    const caretPosition = composer.value.length;
    composer.setSelectionRange(caretPosition, caretPosition);
  }, [activeChannelId, isActiveTextChannel]);

  if (!activeChannel) {
    return <ThreadLoadingState />;
  }

  if (activeChannel.kind === "voice") {
    return (
      <VoiceChannelPanel
        activeCall={call.activeCall}
        channel={activeChannel}
        members={view.activeVoiceMembers}
        onJoin={() => call.joinVoiceChannel(activeChannel)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <MessageFeed
          composerRef={composerRef}
          currentUserId={view.current?.user?._id}
          editingDraft={thread.editingMessageDraft}
          editingMessageId={thread.editingMessageId}
          emptyDescription={`Be the first to post in ${getChannelDisplayName(activeChannel)}.`}
          emptyTitle="No messages yet"
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
          placeholder={`Message ${getChannelDisplayName(activeChannel)}`}
          textareaRef={composerRef}
        />
      </div>
    </div>
  );
}
