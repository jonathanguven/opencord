import {
  AudioLinesIcon,
  CopyIcon,
  PanelLeftIcon,
  PanelRightIcon,
} from "lucide-react";

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

  return (
    <header className="flex items-center justify-between gap-4 border-border/60 border-b px-4 py-3">
      <div className="flex min-w-0 items-start gap-2">
        <Tooltip>
          <TooltipTrigger
            onClick={ui.toggleLeftSidebar}
            render={<Button size="icon-sm" variant="ghost" />}
          >
            <PanelLeftIcon />
          </TooltipTrigger>
          <TooltipContent>
            {ui.isLeftSidebarCollapsed
              ? "Show left sidebar (Cmd/Ctrl+B)"
              : "Hide left sidebar (Cmd/Ctrl+B)"}
          </TooltipContent>
        </Tooltip>
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
            <PanelRightIcon />
          </TooltipTrigger>
          <TooltipContent>
            {ui.isRightSidebarCollapsed
              ? "Show right sidebar (Cmd/Ctrl+Shift+B)"
              : "Hide right sidebar (Cmd/Ctrl+Shift+B)"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
