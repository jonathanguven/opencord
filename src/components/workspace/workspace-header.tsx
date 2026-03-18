import { AudioLinesIcon, CopyIcon } from "lucide-react";

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

export function WorkspaceHeader() {
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const call = useWorkspaceCall();
  let rightSidebarLabel = ui.isRightSidebarCollapsed
    ? "Show Member List"
    : "Hide Member List";

  if (view.isFriendsView) {
    rightSidebarLabel = ui.isRightSidebarCollapsed
      ? "Show User Profile"
      : "Hide User Profile";
  }

  return (
    <header className="flex items-center justify-between gap-4 border-border/60 border-b px-4 py-3">
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-lg">
            {view.headerTitle}
          </div>
          <div className="truncate text-muted-foreground text-sm">
            {view.headerSubtitle}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {view.isFriendsView && view.activeConversation ? (
          <Button onClick={call.startConversationCall} variant="outline">
            <AudioLinesIcon data-icon="inline-start" />
            Start call
          </Button>
        ) : null}
        {view.canCreateServerInvites ? (
          <Button onClick={() => ui.setIsInviteOpen(true)} variant="outline">
            <CopyIcon data-icon="inline-start" />
            Invite
          </Button>
        ) : null}
        <Tooltip>
          <TooltipTrigger
            onClick={ui.toggleRightSidebar}
            render={<Button size="icon-sm" variant="ghost" />}
          >
            {view.isFriendsView ? <UserProfileIcon /> : <MemberListIcon />}
          </TooltipTrigger>
          <TooltipContent>{rightSidebarLabel}</TooltipContent>
        </Tooltip>
      </div>
    </header>
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
