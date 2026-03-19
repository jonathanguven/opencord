import { ScrollArea } from "@/components/ui/scroll-area";
import { DmProfilePanel } from "@/components/workspace/dm-profile-panel";
import { MembersPanel } from "@/components/workspace/members-panel";
import { VoiceChannelChatSidebar } from "@/components/workspace/voice-channel-chat-sidebar";
import {
  useWorkspaceModeration,
  useWorkspaceView,
} from "@/components/workspace/workspace-screen-context";

export function WorkspaceRightSidebar() {
  const view = useWorkspaceView();
  const moderation = useWorkspaceModeration();
  const canModerate = view.permissions.moveMembers || view.permissions.admin;
  const activeVoiceChannel =
    view.activeChannel?.kind === "voice" ? view.activeChannel : null;
  let sidebarContent: React.ReactNode;

  if (view.isFriendsView) {
    sidebarContent = (
      <ScrollArea className="flex-1">
        <DmProfilePanel conversation={view.activeConversation} />
      </ScrollArea>
    );
  } else if (activeVoiceChannel) {
    sidebarContent = (
      <VoiceChannelChatSidebar
        channel={activeVoiceChannel}
        currentUserId={view.current?.user?._id}
      />
    );
  } else {
    sidebarContent = (
      <ScrollArea className="flex-1">
        <MembersPanel
          canModerate={canModerate}
          onForceDeafen={moderation.forceDeafenMember}
          onForceMute={moderation.forceMuteMember}
          onMoveMember={moderation.moveWorkspaceMember}
          voiceChannels={view.voiceChannels}
          voicePresence={view.voicePresence ?? []}
          workspace={view.workspace}
        />
      </ScrollArea>
    );
  }

  return (
    <aside className="flex h-full flex-col border-border/60 border-l bg-card/40">
      {view.isFriendsView ? (
        <div className="border-border/60 border-b px-4 py-3">
          <div className="font-medium text-sm">Profile</div>
          <div className="text-muted-foreground text-xs">
            The person on the other side of the thread.
          </div>
        </div>
      ) : null}

      {sidebarContent}
    </aside>
  );
}
