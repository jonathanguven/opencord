import {
  type Context,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

import { useWorkspaceScreenController } from "@/hooks/use-workspace-screen-controller";

type WorkspaceController = ReturnType<typeof useWorkspaceScreenController>;

type WorkspaceViewContextValue = Pick<
  WorkspaceController,
  | "activeChannel"
  | "activeConversation"
  | "activeConversationId"
  | "activeServer"
  | "activeServerId"
  | "activeVoiceMembers"
  | "canCreateServerInvites"
  | "conversations"
  | "current"
  | "friends"
  | "headerSubtitle"
  | "headerTitle"
  | "inviteLink"
  | "isFriendsView"
  | "permissions"
  | "routeChannelId"
  | "servers"
  | "textChannels"
  | "voiceChannels"
  | "voicePresence"
  | "workspace"
>;

type WorkspaceUiContextValue = Pick<
  WorkspaceController,
  | "isCreateChannelOpen"
  | "isCreateServerOpen"
  | "isInviteOpen"
  | "isLeftSidebarCollapsed"
  | "isRightSidebarCollapsed"
  | "leftSidebarRef"
  | "rightSidebarRef"
  | "setIsCreateChannelOpen"
  | "setIsCreateServerOpen"
  | "setIsInviteOpen"
  | "setIsLeftSidebarCollapsed"
  | "setIsRightSidebarCollapsed"
  | "toggleLeftSidebar"
  | "toggleRightSidebar"
>;

type WorkspaceDialogsContextValue = Pick<
  WorkspaceController,
  | "channelAccessDraft"
  | "channelCategoryLabelDraft"
  | "channelKindDraft"
  | "channelNameDraft"
  | "copyServerInviteLink"
  | "displayNameDraft"
  | "handleDraft"
  | "handleError"
  | "openCreateChannel"
  | "reorderChannelSection"
  | "serverDescriptionDraft"
  | "serverNameDraft"
  | "setChannelAccessDraft"
  | "setChannelKindDraft"
  | "setChannelNameDraft"
  | "setDisplayNameDraft"
  | "setHandleDraft"
  | "setServerDescriptionDraft"
  | "setServerNameDraft"
  | "submitCreateChannel"
  | "submitCreateServer"
  | "submitOnboarding"
>;

type WorkspaceNavigationContextValue = Pick<
  WorkspaceController,
  "handleSignOut" | "navigate" | "openConversation" | "showAddFriendTab"
>;

type WorkspaceFriendsContextValue = Pick<
  WorkspaceController,
  | "acceptFriendRequest"
  | "declineFriendRequest"
  | "friendHandleDraft"
  | "friendsTab"
  | "removeFriendship"
  | "setFriendHandleDraft"
  | "setFriendsTab"
  | "submitFriendRequest"
>;

type WorkspaceThreadContextValue = Pick<
  WorkspaceController,
  | "cancelEditingMessage"
  | "deleteOwnMessage"
  | "editLatestOwnMessage"
  | "editingMessageId"
  | "editOwnMessage"
  | "messages"
  | "messageDraft"
  | "sendActiveMessage"
  | "setMessageDraft"
>;

type WorkspaceCallContextValue = Pick<
  WorkspaceController,
  | "activeCall"
  | "isCallConnecting"
  | "joinVoiceChannel"
  | "leaveActiveCall"
  | "startConversationCall"
  | "toggleDeafen"
  | "toggleMute"
  | "triggerShareScreen"
>;

type WorkspaceModerationContextValue = Pick<
  WorkspaceController,
  "forceDeafenMember" | "forceMuteMember" | "moveWorkspaceMember"
>;

const WorkspaceViewContext = createContext<WorkspaceViewContextValue | null>(
  null
);
const WorkspaceUiContext = createContext<WorkspaceUiContextValue | null>(null);
const WorkspaceDialogsContext =
  createContext<WorkspaceDialogsContextValue | null>(null);
const WorkspaceNavigationContext =
  createContext<WorkspaceNavigationContextValue | null>(null);
const WorkspaceFriendsContext =
  createContext<WorkspaceFriendsContextValue | null>(null);
const WorkspaceThreadContext =
  createContext<WorkspaceThreadContextValue | null>(null);
const WorkspaceCallContext = createContext<WorkspaceCallContextValue | null>(
  null
);
const WorkspaceModerationContext =
  createContext<WorkspaceModerationContextValue | null>(null);

function useRequiredContext<T>(context: Context<T | null>, name: string) {
  const value = useContext(context);

  if (!value) {
    throw new Error(`${name} must be used within WorkspaceScreenProvider.`);
  }

  return value;
}

export function WorkspaceScreenProvider({ children }: { children: ReactNode }) {
  const controller = useWorkspaceScreenController();
  const {
    acceptFriendRequest,
    activeCall,
    activeChannel,
    activeConversation,
    activeConversationId,
    activeServer,
    activeServerId,
    activeVoiceMembers,
    canCreateServerInvites,
    channelAccessDraft,
    channelCategoryLabelDraft,
    channelKindDraft,
    channelNameDraft,
    conversations,
    copyServerInviteLink,
    cancelEditingMessage,
    current,
    deleteOwnMessage,
    declineFriendRequest,
    displayNameDraft,
    editLatestOwnMessage,
    editingMessageId,
    editOwnMessage,
    forceDeafenMember,
    forceMuteMember,
    friendHandleDraft,
    friends,
    friendsTab,
    handleDraft,
    handleError,
    handleSignOut,
    headerSubtitle,
    headerTitle,
    inviteLink,
    isCallConnecting,
    isCreateChannelOpen,
    isCreateServerOpen,
    isFriendsView,
    isInviteOpen,
    isLeftSidebarCollapsed,
    isRightSidebarCollapsed,
    joinVoiceChannel,
    leaveActiveCall,
    leftSidebarRef,
    messageDraft,
    messages,
    moveWorkspaceMember,
    navigate,
    openConversation,
    openCreateChannel,
    permissions,
    removeFriendship,
    reorderChannelSection,
    rightSidebarRef,
    routeChannelId,
    sendActiveMessage,
    serverDescriptionDraft,
    serverNameDraft,
    servers,
    setChannelAccessDraft,
    setChannelKindDraft,
    setChannelNameDraft,
    setDisplayNameDraft,
    setFriendHandleDraft,
    setFriendsTab,
    setHandleDraft,
    setIsCreateChannelOpen,
    setIsCreateServerOpen,
    setIsInviteOpen,
    setIsLeftSidebarCollapsed,
    setIsRightSidebarCollapsed,
    setMessageDraft,
    setServerDescriptionDraft,
    setServerNameDraft,
    showAddFriendTab,
    startConversationCall,
    submitCreateChannel,
    submitCreateServer,
    submitFriendRequest,
    submitOnboarding,
    textChannels,
    toggleDeafen,
    toggleLeftSidebar,
    toggleMute,
    toggleRightSidebar,
    triggerShareScreen,
    voiceChannels,
    voicePresence,
    workspace,
  } = controller;

  const viewValue = useMemo(
    () => ({
      activeChannel,
      activeConversation,
      activeConversationId,
      activeServer,
      activeServerId,
      activeVoiceMembers,
      canCreateServerInvites,
      conversations,
      current,
      friends,
      headerSubtitle,
      headerTitle,
      inviteLink,
      isFriendsView,
      permissions,
      routeChannelId,
      servers,
      textChannels,
      voiceChannels,
      voicePresence,
      workspace,
    }),
    [
      activeChannel,
      activeConversation,
      activeConversationId,
      activeServer,
      activeServerId,
      activeVoiceMembers,
      canCreateServerInvites,
      conversations,
      current,
      friends,
      headerSubtitle,
      headerTitle,
      inviteLink,
      isFriendsView,
      permissions,
      routeChannelId,
      servers,
      textChannels,
      voiceChannels,
      voicePresence,
      workspace,
    ]
  );

  const uiValue = useMemo(
    () => ({
      isCreateChannelOpen,
      isCreateServerOpen,
      isInviteOpen,
      isLeftSidebarCollapsed,
      isRightSidebarCollapsed,
      leftSidebarRef,
      rightSidebarRef,
      setIsCreateChannelOpen,
      setIsCreateServerOpen,
      setIsInviteOpen,
      setIsLeftSidebarCollapsed,
      setIsRightSidebarCollapsed,
      toggleLeftSidebar,
      toggleRightSidebar,
    }),
    [
      isCreateChannelOpen,
      isCreateServerOpen,
      isInviteOpen,
      isLeftSidebarCollapsed,
      isRightSidebarCollapsed,
      leftSidebarRef,
      rightSidebarRef,
      setIsCreateChannelOpen,
      setIsCreateServerOpen,
      setIsInviteOpen,
      setIsLeftSidebarCollapsed,
      setIsRightSidebarCollapsed,
      toggleLeftSidebar,
      toggleRightSidebar,
    ]
  );

  const dialogsValue = useMemo(
    () => ({
      channelAccessDraft,
      channelCategoryLabelDraft,
      channelKindDraft,
      channelNameDraft,
      copyServerInviteLink,
      displayNameDraft,
      handleDraft,
      handleError,
      openCreateChannel,
      reorderChannelSection,
      serverDescriptionDraft,
      serverNameDraft,
      setChannelAccessDraft,
      setChannelKindDraft,
      setChannelNameDraft,
      setDisplayNameDraft,
      setHandleDraft,
      setServerDescriptionDraft,
      setServerNameDraft,
      submitCreateChannel,
      submitCreateServer,
      submitOnboarding,
    }),
    [
      channelAccessDraft,
      channelCategoryLabelDraft,
      channelKindDraft,
      channelNameDraft,
      copyServerInviteLink,
      displayNameDraft,
      handleDraft,
      handleError,
      openCreateChannel,
      reorderChannelSection,
      serverDescriptionDraft,
      serverNameDraft,
      setChannelAccessDraft,
      setChannelKindDraft,
      setChannelNameDraft,
      setDisplayNameDraft,
      setHandleDraft,
      setServerDescriptionDraft,
      setServerNameDraft,
      submitCreateChannel,
      submitCreateServer,
      submitOnboarding,
    ]
  );

  const navigationValue = useMemo(
    () => ({
      handleSignOut,
      navigate,
      openConversation,
      showAddFriendTab,
    }),
    [handleSignOut, navigate, openConversation, showAddFriendTab]
  );

  const friendsValue = useMemo(
    () => ({
      acceptFriendRequest,
      declineFriendRequest,
      friendHandleDraft,
      friendsTab,
      removeFriendship,
      setFriendHandleDraft,
      setFriendsTab,
      submitFriendRequest,
    }),
    [
      acceptFriendRequest,
      declineFriendRequest,
      friendHandleDraft,
      friendsTab,
      removeFriendship,
      setFriendHandleDraft,
      setFriendsTab,
      submitFriendRequest,
    ]
  );

  const threadValue = useMemo(
    () => ({
      cancelEditingMessage,
      deleteOwnMessage,
      editLatestOwnMessage,
      editingMessageId,
      editOwnMessage,
      messages,
      messageDraft,
      sendActiveMessage,
      setMessageDraft,
    }),
    [
      cancelEditingMessage,
      deleteOwnMessage,
      editLatestOwnMessage,
      editingMessageId,
      editOwnMessage,
      messages,
      messageDraft,
      sendActiveMessage,
      setMessageDraft,
    ]
  );

  const callValue = useMemo(
    () => ({
      activeCall,
      isCallConnecting,
      joinVoiceChannel,
      leaveActiveCall,
      startConversationCall,
      toggleDeafen,
      toggleMute,
      triggerShareScreen,
    }),
    [
      activeCall,
      isCallConnecting,
      joinVoiceChannel,
      leaveActiveCall,
      startConversationCall,
      toggleDeafen,
      toggleMute,
      triggerShareScreen,
    ]
  );

  const moderationValue = useMemo(
    () => ({
      forceDeafenMember,
      forceMuteMember,
      moveWorkspaceMember,
    }),
    [forceDeafenMember, forceMuteMember, moveWorkspaceMember]
  );

  return (
    <WorkspaceViewContext.Provider value={viewValue}>
      <WorkspaceUiContext.Provider value={uiValue}>
        <WorkspaceDialogsContext.Provider value={dialogsValue}>
          <WorkspaceNavigationContext.Provider value={navigationValue}>
            <WorkspaceFriendsContext.Provider value={friendsValue}>
              <WorkspaceThreadContext.Provider value={threadValue}>
                <WorkspaceCallContext.Provider value={callValue}>
                  <WorkspaceModerationContext.Provider value={moderationValue}>
                    {children}
                  </WorkspaceModerationContext.Provider>
                </WorkspaceCallContext.Provider>
              </WorkspaceThreadContext.Provider>
            </WorkspaceFriendsContext.Provider>
          </WorkspaceNavigationContext.Provider>
        </WorkspaceDialogsContext.Provider>
      </WorkspaceUiContext.Provider>
    </WorkspaceViewContext.Provider>
  );
}

export const useWorkspaceView = () =>
  useRequiredContext(WorkspaceViewContext, "useWorkspaceView");

export const useWorkspaceUi = () =>
  useRequiredContext(WorkspaceUiContext, "useWorkspaceUi");

export const useWorkspaceDialogs = () =>
  useRequiredContext(WorkspaceDialogsContext, "useWorkspaceDialogs");

export const useWorkspaceNavigation = () =>
  useRequiredContext(WorkspaceNavigationContext, "useWorkspaceNavigation");

export const useWorkspaceFriends = () =>
  useRequiredContext(WorkspaceFriendsContext, "useWorkspaceFriends");

export const useWorkspaceThread = () =>
  useRequiredContext(WorkspaceThreadContext, "useWorkspaceThread");

export const useWorkspaceCall = () =>
  useRequiredContext(WorkspaceCallContext, "useWorkspaceCall");

export const useWorkspaceModeration = () =>
  useRequiredContext(WorkspaceModerationContext, "useWorkspaceModeration");
