import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CallTray } from "@/components/workspace/call-tray";
import { InviteDialog } from "@/components/workspace/invite-dialog";
import {
  CreateChannelDialog,
  CreateServerDialog,
  OnboardingDialog,
} from "@/components/workspace/workspace-dialogs";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import {
  WorkspaceRail,
  WorkspaceSidebar,
} from "@/components/workspace/workspace-left-sidebar";
import { WorkspaceMainContent } from "@/components/workspace/workspace-main-content";
import { WorkspaceRightSidebar } from "@/components/workspace/workspace-right-sidebar";
import { useWorkspaceScreenController } from "@/hooks/use-workspace-screen-controller";
import { getChannelPath, getDmPath, getServerPath } from "@/lib/workspace";

const CHANNELS_PATH = "/channels";

export function WorkspaceScreen() {
  const controller = useWorkspaceScreenController();

  return (
    <div className="flex min-h-svh bg-[#313338] text-[#f2f3f5]">
      <OnboardingDialog
        displayNameDraft={controller.displayNameDraft}
        handleDraft={controller.handleDraft}
        handleError={controller.handleError}
        needsOnboarding={controller.current?.needsOnboarding}
        onDisplayNameChange={controller.setDisplayNameDraft}
        onHandleChange={controller.setHandleDraft}
        onSubmit={controller.submitOnboarding}
      />

      <CreateServerDialog
        description={controller.serverDescriptionDraft}
        name={controller.serverNameDraft}
        onDescriptionChange={controller.setServerDescriptionDraft}
        onNameChange={controller.setServerNameDraft}
        onOpenChange={controller.setIsCreateServerOpen}
        onSubmit={controller.submitCreateServer}
        open={controller.isCreateServerOpen}
      />

      <InviteDialog
        activeServer={controller.activeServer}
        friends={controller.friends?.friends ?? []}
        inviteLink={controller.inviteLink}
        landingChannelName={controller.textChannels[0]?.name ?? "general"}
        onCopyInviteLink={controller.copyServerInviteLink}
        onOpenChange={controller.setIsInviteOpen}
        open={controller.isInviteOpen}
      />

      <CreateChannelDialog
        access={controller.channelAccessDraft}
        kind={controller.channelKindDraft}
        name={controller.channelNameDraft}
        onAccessChange={controller.setChannelAccessDraft}
        onKindChange={controller.setChannelKindDraft}
        onNameChange={controller.setChannelNameDraft}
        onOpenChange={controller.setIsCreateChannelOpen}
        onSubmit={controller.submitCreateChannel}
        open={controller.isCreateChannelOpen}
      />

      <WorkspaceRail
        activeServerId={controller.activeServerId}
        isFriendsView={controller.isFriendsView}
        onCreateServer={() => controller.setIsCreateServerOpen(true)}
        onOpenFriends={() => controller.navigate(CHANNELS_PATH)}
        onOpenServer={(serverId) =>
          controller.navigate(getServerPath(serverId))
        }
        servers={controller.servers}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ResizablePanelGroup className="min-h-svh" orientation="horizontal">
          <ResizablePanel
            collapsedSize="0%"
            collapsible
            defaultSize="22%"
            maxSize="26%"
            minSize="12%"
            onResize={(size) =>
              controller.setIsLeftSidebarCollapsed(size.asPercentage === 0)
            }
            panelRef={controller.leftSidebarRef}
          >
            <WorkspaceSidebar
              activeChannelId={controller.routeChannelId}
              activeConversationId={controller.activeConversationId}
              activeServer={controller.activeServer}
              allowServerInvites={controller.canCreateServerInvites}
              conversations={controller.conversations}
              currentUser={controller.current?.user}
              isFriendsView={controller.isFriendsView}
              onCreateChannel={() => controller.setIsCreateChannelOpen(true)}
              onOpenAddFriend={controller.showAddFriendTab}
              onOpenConversation={(conversationId) =>
                controller.navigate(getDmPath(conversationId))
              }
              onOpenInvite={() => controller.setIsInviteOpen(true)}
              onOpenServerChannel={(channelId) =>
                controller.activeServerId
                  ? controller.navigate(
                      getChannelPath(controller.activeServerId, channelId)
                    )
                  : undefined
              }
              onOpenTab={(value) => {
                controller.navigate(CHANNELS_PATH);
                controller.setFriendsTab(value);
              }}
              onSignOut={controller.handleSignOut}
              permissions={controller.permissions}
              textChannels={controller.textChannels}
              voiceChannels={controller.voiceChannels}
              voicePresence={controller.voicePresence}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="58%" minSize="40%">
            <main className="flex h-full min-w-0 flex-col bg-background">
              <WorkspaceHeader
                activeConversation={Boolean(controller.activeConversation)}
                allowInvites={controller.canCreateServerInvites}
                headerSubtitle={controller.headerSubtitle}
                headerTitle={controller.headerTitle}
                isFriendsView={controller.isFriendsView}
                isLeftSidebarCollapsed={controller.isLeftSidebarCollapsed}
                isRightSidebarCollapsed={controller.isRightSidebarCollapsed}
                onOpenInvite={() => controller.setIsInviteOpen(true)}
                onStartCall={controller.startConversationCall}
                onToggleLeftSidebar={controller.toggleLeftSidebar}
                onToggleRightSidebar={controller.toggleRightSidebar}
              />

              <div className="min-h-0 flex-1">
                <WorkspaceMainContent
                  activeCall={controller.activeCall}
                  activeChannel={controller.activeChannel}
                  activeConversation={controller.activeConversation}
                  activeConversationId={controller.activeConversationId}
                  activeVoiceMembers={controller.activeVoiceMembers}
                  friendHandleDraft={controller.friendHandleDraft}
                  friends={controller.friends}
                  friendsTab={controller.friendsTab}
                  isFriendsView={controller.isFriendsView}
                  messageDraft={controller.messageDraft}
                  messages={controller.messages}
                  onAcceptRequest={controller.acceptFriendRequest}
                  onChangeDraft={controller.setMessageDraft}
                  onDeclineRequest={controller.declineFriendRequest}
                  onFriendHandleChange={controller.setFriendHandleDraft}
                  onJoinVoice={controller.joinVoiceChannel}
                  onMessageFriend={controller.openConversation}
                  onRemoveFriend={controller.removeFriendship}
                  onSendMessage={controller.sendActiveMessage}
                  onSubmitFriendRequest={controller.submitFriendRequest}
                  onTabChange={controller.setFriendsTab}
                />
              </div>

              <CallTray
                activeCall={controller.activeCall}
                isConnecting={controller.isCallConnecting}
                onDeafen={controller.toggleDeafen}
                onLeave={controller.leaveActiveCall}
                onMute={controller.toggleMute}
                onShareScreen={controller.triggerShareScreen}
              />
            </main>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            collapsedSize="0%"
            collapsible
            defaultSize="24%"
            maxSize="30%"
            minSize="14%"
            onResize={(size) =>
              controller.setIsRightSidebarCollapsed(size.asPercentage === 0)
            }
            panelRef={controller.rightSidebarRef}
          >
            <WorkspaceRightSidebar
              activeConversation={controller.activeConversation}
              canModerate={
                controller.permissions.moveMembers ||
                controller.permissions.admin
              }
              currentUserId={controller.current?.user?._id ?? null}
              isFriendsView={controller.isFriendsView}
              onForceDeafen={controller.forceDeafenMember}
              onForceMute={controller.forceMuteMember}
              onMoveMember={controller.moveWorkspaceMember}
              voiceChannels={controller.voiceChannels}
              voicePresence={controller.voicePresence ?? []}
              workspace={controller.workspace}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
