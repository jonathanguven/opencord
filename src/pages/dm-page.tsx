import {
  AudioLinesIcon,
  MicIcon,
  MicOffIcon,
  PhoneOffIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useWorkspaceCall,
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

  const conversationName = getDisplayName(activeConversation.otherUser);
  const isConversationCallLive = Boolean(activeConversation.activeCall);

  return (
    <div className="flex h-full flex-col">
      <DmCallBanner
        conversationId={activeConversation._id}
        conversationName={conversationName}
        hasActiveSession={isConversationCallLive}
      />
      <ScrollArea className="min-h-0 flex-1">
        <MessageFeed
          currentUserId={view.current?.user?._id}
          editingMessageId={thread.editingMessageId}
          emptyDescription={`Start the conversation with ${conversationName}.`}
          emptyTitle="Say hello"
          messages={thread.messages}
          onDeleteMessage={thread.deleteOwnMessage}
          onEditMessage={thread.editOwnMessage}
        />
      </ScrollArea>
      <div className="border-border/60 border-t p-4">
        <MessageComposer
          draft={thread.messageDraft}
          editingMessageId={thread.editingMessageId}
          onCancelEdit={thread.cancelEditingMessage}
          onChange={thread.setMessageDraft}
          onEditLatestMessage={thread.editLatestOwnMessage}
          onSend={thread.sendActiveMessage}
          placeholder={`Message ${conversationName}`}
        />
      </div>
    </div>
  );
}

function DmCallBanner({
  conversationId,
  conversationName,
  hasActiveSession,
}: {
  conversationId: string;
  conversationName: string;
  hasActiveSession: boolean;
}) {
  const call = useWorkspaceCall();
  const activeCall = call.activeCall;
  const isInConversationCall =
    activeCall?.kind === "dm" && activeCall.conversationId === conversationId;

  if (!(hasActiveSession || isInConversationCall)) {
    return null;
  }

  return (
    <div className="border-border/60 border-b px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/8 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium">
            <AudioLinesIcon className="size-4" />
            <span className="truncate">
              {isInConversationCall
                ? `In call with ${conversationName}`
                : `${conversationName} is in a call`}
            </span>
            <Badge variant="secondary">
              {isInConversationCall ? "Live" : "Joinable"}
            </Badge>
          </div>
          <div className="truncate text-muted-foreground text-xs">
            {isInConversationCall
              ? `Room ${activeCall.roomKey}`
              : "Join from here without shifting the composer."}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isInConversationCall ? (
            <>
              <Button
                onClick={call.toggleMute}
                size="icon-sm"
                variant={activeCall.muted ? "secondary" : "outline"}
              >
                {activeCall.muted ? <MicOffIcon /> : <MicIcon />}
              </Button>
              <Button
                onClick={call.toggleDeafen}
                size="icon-sm"
                variant={activeCall.deafened ? "secondary" : "outline"}
              >
                {activeCall.deafened ? <VolumeXIcon /> : <Volume2Icon />}
              </Button>
              <Button onClick={call.leaveActiveCall} variant="destructive">
                <PhoneOffIcon data-icon="inline-start" />
                {call.isCallConnecting ? "Cancel" : "Leave call"}
              </Button>
            </>
          ) : (
            <Button onClick={call.startConversationCall} variant="outline">
              <AudioLinesIcon data-icon="inline-start" />
              Join call
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
