import { MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useWorkspaceCall,
  useWorkspaceUi,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";
import type { ConversationListItem } from "@/components/workspace/workspace-types";
import { getChannelNameText } from "@/lib/channel-name";

export function WorkspaceHeader() {
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const call = useWorkspaceCall();
  const isInConversationCall =
    view.activeConversation?._id &&
    call.activeCall?.kind === "dm" &&
    call.activeCall.conversationId === view.activeConversation._id;
  const activeTextChannel =
    view.activeChannel?.kind === "text" ? view.activeChannel : null;
  const rightSidebarToggle = getRightSidebarToggle({
    isFriendsView: view.isFriendsView,
    isRightSidebarCollapsed: ui.isRightSidebarCollapsed,
    isVoiceChannelView: view.activeChannel?.kind === "voice",
  });

  return (
    <header className="flex items-center justify-between gap-3 border-border/60 border-b px-3 py-2">
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-base">
            {activeTextChannel ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="text-[#8e9297]">
                  #
                </span>
                <span>{getChannelNameText(activeTextChannel)}</span>
              </span>
            ) : (
              view.headerTitle
            )}
          </div>
          <div className="truncate text-muted-foreground text-xs">
            {view.headerSubtitle}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ConversationCallAction
          activeConversation={view.activeConversation}
          isCallConnecting={call.isCallConnecting}
          isFriendsView={view.isFriendsView}
          isInConversationCall={Boolean(isInConversationCall)}
          onLeaveActiveCall={call.leaveActiveCall}
          onStartConversationCall={call.startConversationCall}
        />
        <Tooltip>
          <TooltipTrigger
            onClick={ui.toggleRightSidebar}
            render={
              <Button
                className="size-7 rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-accent hover:text-foreground"
                size="icon-sm"
                type="button"
                variant="plain"
              />
            }
          >
            {rightSidebarToggle.icon}
          </TooltipTrigger>
          <TooltipContent>{rightSidebarToggle.label}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

function ConversationCallAction({
  activeConversation,
  isCallConnecting,
  isFriendsView,
  isInConversationCall,
  onLeaveActiveCall,
  onStartConversationCall,
}: {
  activeConversation: ConversationListItem | null;
  isCallConnecting: boolean;
  isFriendsView: boolean;
  isInConversationCall: boolean;
  onLeaveActiveCall: () => void;
  onStartConversationCall: () => void;
}) {
  if (!(isFriendsView && activeConversation)) {
    return null;
  }

  const hasActiveConversationCall = Boolean(activeConversation.activeCall);
  let callActionLabel = "Start call";

  if (isInConversationCall) {
    callActionLabel = isCallConnecting ? "Cancel" : "Leave call";
  } else if (hasActiveConversationCall) {
    callActionLabel = "Join call";
  }

  if (callActionLabel === "Start call") {
    return (
      <Tooltip>
        <TooltipTrigger
          aria-label="start voice call"
          onClick={onStartConversationCall}
          render={
            <Button
              className="size-7 rounded-[min(var(--radius-md),12px)] text-muted-foreground hover:bg-accent hover:text-foreground"
              size="icon-sm"
              type="button"
              variant="plain"
            />
          }
        >
          <StartVoiceCallIcon />
        </TooltipTrigger>
        <TooltipContent>start voice call</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={
        isInConversationCall ? onLeaveActiveCall : onStartConversationCall
      }
      variant="outline"
    >
      {callActionLabel}
    </Button>
  );
}

function getRightSidebarToggle({
  isFriendsView,
  isRightSidebarCollapsed,
  isVoiceChannelView,
}: {
  isFriendsView: boolean;
  isRightSidebarCollapsed: boolean;
  isVoiceChannelView: boolean;
}) {
  if (isFriendsView) {
    return {
      icon: <UserProfileIcon />,
      label: isRightSidebarCollapsed
        ? "Show User Profile"
        : "Hide User Profile",
    };
  }

  if (isVoiceChannelView) {
    return {
      icon: <MessageCircleIcon />,
      label: isRightSidebarCollapsed ? "Show Voice Chat" : "Hide Voice Chat",
    };
  }

  return {
    icon: <MemberListIcon />,
    label: isRightSidebarCollapsed ? "Show Member List" : "Hide Member List",
  };
}

function StartVoiceCallIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 7.4A5.4 5.4 0 0 1 7.4 2c.36 0 .7.22.83.55l1.93 4.64a1 1 0 0 1-.43 1.25L7 10a8.52 8.52 0 0 0 7 7l1.12-2.24a1 1 0 0 1 1.19-.51l5.06 1.56c.38.11.63.46.63.85C22 19.6 19.6 22 16.66 22h-.37C8.39 22 2 15.6 2 7.71V7.4ZM13 3a1 1 0 0 1 1-1 8 8 0 0 1 8 8 1 1 0 1 1-2 0 6 6 0 0 0-6-6 1 1 0 0 1-1-1Z"
        fill="currentColor"
      />
      <path
        d="M13 7a1 1 0 0 1 1-1 4 4 0 0 1 4 4 1 1 0 1 1-2 0 2 2 0 0 0-2-2 1 1 0 0 1-1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UserProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M23 12.38c-.02.38-.45.58-.78.4a6.97 6.97 0 0 0-6.27-.08.54.54 0 0 1-.44 0 8.97 8.97 0 0 0-11.16 3.55c-.1.15-.1.35 0 .5.37.58.8 1.13 1.28 1.61.24.24.64.15.8-.15.19-.38.39-.73.58-1.02.14-.21.43-.1.4.15l-.19 1.96c-.02.19.07.37.23.47A8.96 8.96 0 0 0 12 21a.4.4 0 0 1 .38.27c.1.33.25.65.4.95.18.34-.02.76-.4.77L12 23a11 11 0 1 1 11-10.62ZM15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <path d="M24 19a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" fill="currentColor" />
    </svg>
  );
}

function MemberListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 8a3 3 0 1 0-2.7-4.3c-.2.4.06.86.44 1.12a5 5 0 0 1 2.14 3.08c.01.06.06.1.12.1ZM18.44 17.27c.15.43.54.73 1 .73h1.06c.83 0 1.5-.67 1.5-1.5a7.5 7.5 0 0 0-6.5-7.43c-.55-.08-.99.38-1.1.92-.06.3-.15.6-.26.87-.23.58-.05 1.3.47 1.63a9.53 9.53 0 0 1 3.83 4.78ZM12.5 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 20.5a7.5 7.5 0 0 1 15 0c0 .83-.67 1.5-1.5 1.5a.2.2 0 0 1-.2-.16c-.2-.96-.56-1.87-.88-2.54-.1-.23-.42-.15-.42.1v2.1a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2.1c0-.25-.31-.33-.42-.1-.32.67-.67 1.58-.88 2.54a.2.2 0 0 1-.2.16A1.5 1.5 0 0 1 2 20.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
