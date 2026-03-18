import type { FormEvent } from "react";

import { FriendsHome } from "@/components/workspace/friends-home";
import type { FriendsResult } from "@/components/workspace/workspace-types";
import type { Id } from "../../convex/_generated/dataModel";

interface ChannelsPageProps {
  friendHandleDraft: string;
  friends: FriendsResult | undefined;
  onAcceptRequest: (requestId: Id<"friendRequests">) => void;
  onDeclineRequest: (requestId: Id<"friendRequests">) => void;
  onFriendHandleChange: (value: string) => void;
  onMessageFriend: (friendId: Id<"users">) => void;
  onRemoveFriend: (friendId: Id<"users">) => void;
  onSubmitFriendRequest: (event: FormEvent<HTMLFormElement>) => void;
  onTabChange: (value: string) => void;
  selectedTab: string;
}

export function ChannelsPage(props: ChannelsPageProps) {
  return <FriendsHome {...props} />;
}
