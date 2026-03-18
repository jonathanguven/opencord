import { ScrollArea } from "@/components/ui/scroll-area";
import { DmProfilePanel } from "@/components/workspace/dm-profile-panel";
import { MembersPanel } from "@/components/workspace/members-panel";
import {
  useWorkspaceModeration,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";

export function WorkspaceRightSidebar() {
  const view = useWorkspaceView();
  const moderation = useWorkspaceModeration();
  const canModerate = view.permissions.moveMembers || view.permissions.admin;

  return (
    <aside className="flex h-full flex-col border-border/60 border-l bg-card/40">
      <div className="border-border/60 border-b px-4 py-3">
        <div className="font-medium text-sm">
          {view.isFriendsView ? "Profile" : "Members"}
        </div>
        <div className="text-muted-foreground text-xs">
          {view.isFriendsView
            ? "The person on the other side of the thread."
            : "Live workspace roster and voice moderation shortcuts."}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {view.isFriendsView ? (
          <DmProfilePanel conversation={view.activeConversation} />
        ) : (
          <MembersPanel
            canModerate={canModerate}
            currentUserId={view.current?.user?._id ?? null}
            onForceDeafen={moderation.forceDeafenMember}
            onForceMute={moderation.forceMuteMember}
            onMoveMember={moderation.moveWorkspaceMember}
            voiceChannels={view.voiceChannels}
            voicePresence={view.voicePresence ?? []}
            workspace={view.workspace}
          />
        )}
      </ScrollArea>
    </aside>
  );
}
