import type { FormEvent } from "react";

import type {
  ActiveCall,
  ConversationListItem,
  FriendsResult,
  MessageListItem,
  VoicePresenceItem,
} from "@/components/workspace/workspace-types";
import { ChannelsPage } from "@/pages/channels-page";
import { DmPage } from "@/pages/dm-page";
import { ServerChannelPage } from "@/pages/server-channel-page";
import { ThreadLoadingState } from "@/pages/workspace-page-parts";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface WorkspaceMainContentProps {
  activeCall: ActiveCall | null;
  activeChannel: Doc<"channels"> | null;
  activeConversation: ConversationListItem | null;
  activeConversationId: Id<"conversations"> | null;
  activeVoiceMembers: VoicePresenceItem[];
  friendHandleDraft: string;
  friends: FriendsResult | undefined;
  friendsTab: string;
  isFriendsView: boolean;
  messageDraft: string;
  messages: MessageListItem[] | undefined;
  onAcceptRequest: (requestId: Id<"friendRequests">) => void;
  onChangeDraft: (value: string) => void;
  onDeclineRequest: (requestId: Id<"friendRequests">) => void;
  onFriendHandleChange: (value: string) => void;
  onJoinVoice: (channel: Doc<"channels">) => void;
  onMessageFriend: (friendId: Id<"users">) => void;
  onRemoveFriend: (friendId: Id<"users">) => void;
  onSendMessage: () => void;
  onSubmitFriendRequest: (event: FormEvent<HTMLFormElement>) => void;
  onTabChange: (value: string) => void;
}

export function WorkspaceMainContent({
  activeCall,
  activeChannel,
  activeConversation,
  activeConversationId,
  activeVoiceMembers,
  friendHandleDraft,
  friends,
  friendsTab,
  isFriendsView,
  messageDraft,
  messages,
  onAcceptRequest,
  onChangeDraft,
  onDeclineRequest,
  onFriendHandleChange,
  onJoinVoice,
  onMessageFriend,
  onRemoveFriend,
  onSendMessage,
  onSubmitFriendRequest,
  onTabChange,
}: WorkspaceMainContentProps) {
  if (isFriendsView) {
    if (activeConversation) {
      return (
        <DmPage
          activeConversation={activeConversation}
          activeConversationId={activeConversationId}
          messageDraft={messageDraft}
          messages={messages}
          onChangeDraft={onChangeDraft}
          onSendMessage={onSendMessage}
        />
      );
    }

    if (activeConversationId) {
      return <ThreadLoadingState />;
    }

    return (
      <ChannelsPage
        friendHandleDraft={friendHandleDraft}
        friends={friends}
        onAcceptRequest={onAcceptRequest}
        onDeclineRequest={onDeclineRequest}
        onFriendHandleChange={onFriendHandleChange}
        onMessageFriend={onMessageFriend}
        onRemoveFriend={onRemoveFriend}
        onSubmitFriendRequest={onSubmitFriendRequest}
        onTabChange={onTabChange}
        selectedTab={friendsTab}
      />
    );
  }

  if (activeChannel) {
    return (
      <ServerChannelPage
        activeCall={activeCall}
        activeChannel={activeChannel}
        activeVoiceMembers={activeVoiceMembers}
        messageDraft={messageDraft}
        messages={messages}
        onChangeDraft={onChangeDraft}
        onJoinVoice={onJoinVoice}
        onSendMessage={onSendMessage}
      />
    );
  }

  return <ThreadLoadingState />;
}
