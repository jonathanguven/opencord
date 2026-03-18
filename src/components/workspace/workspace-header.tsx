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

interface WorkspaceHeaderProps {
  activeConversation: boolean;
  allowInvites: boolean;
  headerSubtitle: string;
  headerTitle: string;
  isFriendsView: boolean;
  isLeftSidebarCollapsed: boolean;
  isRightSidebarCollapsed: boolean;
  onOpenInvite: () => void;
  onStartCall: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export function WorkspaceHeader({
  activeConversation,
  allowInvites,
  headerSubtitle,
  headerTitle,
  isFriendsView,
  isLeftSidebarCollapsed,
  isRightSidebarCollapsed,
  onOpenInvite,
  onStartCall,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-border/60 border-b px-4 py-3">
      <div className="flex min-w-0 items-start gap-2">
        <Tooltip>
          <TooltipTrigger
            onClick={onToggleLeftSidebar}
            render={<Button size="icon-sm" variant="ghost" />}
          >
            <PanelLeftIcon />
          </TooltipTrigger>
          <TooltipContent>
            {isLeftSidebarCollapsed
              ? "Show left sidebar (Cmd/Ctrl+B)"
              : "Hide left sidebar (Cmd/Ctrl+B)"}
          </TooltipContent>
        </Tooltip>
        <div className="min-w-0">
          <div className="truncate font-semibold text-lg">{headerTitle}</div>
          <div className="truncate text-muted-foreground text-sm">
            {headerSubtitle}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isFriendsView && activeConversation ? (
          <Button onClick={onStartCall} variant="outline">
            <AudioLinesIcon data-icon="inline-start" />
            Start call
          </Button>
        ) : null}
        {allowInvites ? (
          <Button onClick={onOpenInvite} variant="outline">
            <CopyIcon data-icon="inline-start" />
            Invite
          </Button>
        ) : null}
        <Tooltip>
          <TooltipTrigger
            onClick={onToggleRightSidebar}
            render={<Button size="icon-sm" variant="ghost" />}
          >
            <PanelRightIcon />
          </TooltipTrigger>
          <TooltipContent>
            {isRightSidebarCollapsed
              ? "Show right sidebar (Cmd/Ctrl+Shift+B)"
              : "Hide right sidebar (Cmd/Ctrl+Shift+B)"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
