import { ScrollArea } from "@/components/ui/scroll-area";
import { DmProfilePanel } from "@/components/workspace/dm-profile-panel";
import { MembersPanel } from "@/components/workspace/members-panel";
import type {
  ConversationListItem,
  VoicePresenceItem,
  WorkspaceResult,
} from "@/components/workspace/workspace-types";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface WorkspaceRightSidebarProps {
  activeConversation: ConversationListItem | null;
  canModerate: boolean;
  currentUserId: Id<"users"> | null;
  isFriendsView: boolean;
  onForceDeafen: (memberUserId: Id<"users">, forcedDeafen: boolean) => void;
  onForceMute: (memberUserId: Id<"users">, forcedMute: boolean) => void;
  onMoveMember: (
    memberUserId: Id<"users">,
    targetChannelId: Id<"channels">
  ) => void;
  voiceChannels: Doc<"channels">[];
  voicePresence: VoicePresenceItem[];
  workspace: WorkspaceResult | undefined;
}

export function WorkspaceRightSidebar({
  activeConversation,
  canModerate,
  currentUserId,
  isFriendsView,
  onForceDeafen,
  onForceMute,
  onMoveMember,
  voiceChannels,
  voicePresence,
  workspace,
}: WorkspaceRightSidebarProps) {
  return (
    <aside className="flex h-full flex-col border-border/60 border-l bg-card/40">
      <div className="border-border/60 border-b px-4 py-3">
        <div className="font-medium text-sm">
          {isFriendsView ? "Profile" : "Members"}
        </div>
        <div className="text-muted-foreground text-xs">
          {isFriendsView
            ? "The person on the other side of the thread."
            : "Live workspace roster and voice moderation shortcuts."}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isFriendsView ? (
          <DmProfilePanel conversation={activeConversation} />
        ) : (
          <MembersPanel
            canModerate={canModerate}
            currentUserId={currentUserId}
            onForceDeafen={onForceDeafen}
            onForceMute={onForceMute}
            onMoveMember={onMoveMember}
            voiceChannels={voiceChannels}
            voicePresence={voicePresence}
            workspace={workspace}
          />
        )}
      </ScrollArea>
    </aside>
  );
}
