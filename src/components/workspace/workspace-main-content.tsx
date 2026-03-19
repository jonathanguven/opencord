import { useWorkspaceView } from "@/components/workspace/workspace-screen-context";
import { ChannelsPage } from "@/pages/channels-page";
import { DmPage } from "@/pages/dm-page";
import { ServerChannelPage } from "@/pages/server-channel-page";
import { ThreadLoadingState } from "@/pages/workspace-page-parts";
export function WorkspaceMainContent() {
  const view = useWorkspaceView();
  let content: React.ReactNode;

  if (view.isFriendsView) {
    if (view.activeConversation) {
      content = <DmPage />;
    } else if (view.activeConversationId) {
      content = <ThreadLoadingState />;
    } else {
      content = <ChannelsPage />;
    }
  } else if (view.activeChannel) {
    content = <ServerChannelPage />;
  } else {
    content = <ThreadLoadingState />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {content}
    </div>
  );
}
