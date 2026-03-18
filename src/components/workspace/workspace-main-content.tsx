import { useWorkspaceView } from "@/components/workspace/workspace-screen-context";
import { ChannelsPage } from "@/pages/channels-page";
import { DmPage } from "@/pages/dm-page";
import { ServerChannelPage } from "@/pages/server-channel-page";
import { ThreadLoadingState } from "@/pages/workspace-page-parts";
export function WorkspaceMainContent() {
  const view = useWorkspaceView();

  if (view.isFriendsView) {
    if (view.activeConversation) {
      return <DmPage />;
    }

    if (view.activeConversationId) {
      return <ThreadLoadingState />;
    }

    return <ChannelsPage />;
  }

  if (view.activeChannel) {
    return <ServerChannelPage />;
  }

  return <ThreadLoadingState />;
}
