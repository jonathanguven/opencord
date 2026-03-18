import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceChannelPanel } from "@/components/workspace/voice-channel-panel";
import {
  useWorkspaceCall,
  useWorkspaceThread,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import {
  MessageComposer,
  MessageFeed,
  ThreadLoadingState,
} from "./workspace-page-parts";

export function ServerChannelPage() {
  const view = useWorkspaceView();
  const thread = useWorkspaceThread();
  const call = useWorkspaceCall();

  const activeChannel = view.activeChannel;

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
          emptyDescription={`Be the first to post in #${activeChannel.name}.`}
          emptyTitle="No messages yet"
          messages={thread.messages}
        />
      </ScrollArea>
      <div className="border-border/60 border-t px-3 py-2.5">
        <MessageComposer
          draft={thread.messageDraft}
          onChange={thread.setMessageDraft}
          onSend={thread.sendActiveMessage}
          placeholder={`Message #${activeChannel.name}`}
        />
      </div>
    </div>
  );
}
