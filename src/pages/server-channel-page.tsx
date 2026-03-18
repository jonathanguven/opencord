import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceChannelPanel } from "@/components/workspace/voice-channel-panel";
import type {
  ActiveCall,
  MessageListItem,
  VoicePresenceItem,
} from "@/components/workspace/workspace-types";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  MessageComposer,
  MessageFeed,
  ThreadLoadingState,
} from "./workspace-page-parts";

interface ServerChannelPageProps {
  activeCall: ActiveCall | null;
  activeChannel: Doc<"channels"> | null;
  activeVoiceMembers: VoicePresenceItem[];
  messageDraft: string;
  messages: MessageListItem[] | undefined;
  onChangeDraft: (value: string) => void;
  onJoinVoice: (channel: Doc<"channels">) => void;
  onSendMessage: () => void;
}

export function ServerChannelPage({
  activeCall,
  activeChannel,
  activeVoiceMembers,
  messageDraft,
  messages,
  onChangeDraft,
  onJoinVoice,
  onSendMessage,
}: ServerChannelPageProps) {
  if (!activeChannel) {
    return <ThreadLoadingState />;
  }

  if (activeChannel.kind === "voice") {
    return (
      <VoiceChannelPanel
        activeCall={activeCall}
        channel={activeChannel}
        members={activeVoiceMembers}
        onJoin={() => onJoinVoice(activeChannel)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <MessageFeed
          emptyDescription={`Be the first to post in #${activeChannel.name}.`}
          emptyTitle="No messages yet"
          messages={messages}
        />
      </ScrollArea>
      <div className="border-border/60 border-t p-4">
        <MessageComposer
          draft={messageDraft}
          onChange={onChangeDraft}
          onSend={onSendMessage}
          placeholder={`Message #${activeChannel.name}`}
        />
      </div>
    </div>
  );
}
