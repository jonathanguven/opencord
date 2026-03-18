import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CallTray } from "@/components/workspace/call-tray";
import { InviteDialog } from "@/components/workspace/invite-dialog";
import { WorkspaceCommandPalette } from "@/components/workspace/workspace-command-palette";
import {
  CreateChannelDialog,
  CreateServerDialog,
  OnboardingDialog,
  RenameChannelDialog,
} from "@/components/workspace/workspace-dialogs";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import {
  WorkspaceRail,
  WorkspaceSidebar,
} from "@/components/workspace/workspace-left-sidebar";
import { WorkspaceMainContent } from "@/components/workspace/workspace-main-content";
import { WorkspaceRightSidebar } from "@/components/workspace/workspace-right-sidebar";
import {
  useWorkspaceCall,
  useWorkspaceDialogs,
  useWorkspaceUi,
  useWorkspaceView,
  WorkspaceScreenProvider,
} from "@/components/workspace/workspace-screen-context";

export function WorkspaceScreen() {
  return (
    <WorkspaceScreenProvider>
      <WorkspaceScreenLayout />
    </WorkspaceScreenProvider>
  );
}

function WorkspaceScreenLayout() {
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const dialogs = useWorkspaceDialogs();
  const call = useWorkspaceCall();
  const showWorkspaceHeader =
    !view.isFriendsView || Boolean(view.activeConversationId);

  return (
    <div className="flex min-h-svh bg-[#313338] text-[#f2f3f5]">
      <OnboardingDialog
        displayNameDraft={dialogs.displayNameDraft}
        handleDraft={dialogs.handleDraft}
        handleError={dialogs.handleError}
        needsOnboarding={view.current?.needsOnboarding}
        onDisplayNameChange={dialogs.setDisplayNameDraft}
        onHandleChange={dialogs.setHandleDraft}
        onSubmit={dialogs.submitOnboarding}
      />

      <CreateServerDialog
        description={dialogs.serverDescriptionDraft}
        joinInviteCode={dialogs.joinServerInviteDraft}
        joinInviteError={dialogs.joinServerInviteError}
        mode={dialogs.serverDialogMode}
        name={dialogs.serverNameDraft}
        onDescriptionChange={dialogs.setServerDescriptionDraft}
        onJoinInviteChange={(value) => {
          dialogs.setJoinServerInviteDraft(value);
          dialogs.setJoinServerInviteError(null);
        }}
        onNameChange={dialogs.setServerNameDraft}
        onOpenChange={ui.setIsCreateServerOpen}
        onSubmitCreate={dialogs.submitCreateServer}
        onSubmitJoin={dialogs.submitJoinServer}
        onToggleMode={dialogs.setServerDialogMode}
        open={ui.isCreateServerOpen}
      />

      <InviteDialog
        activeServer={view.activeServer}
        conversations={view.conversations ?? []}
        inviteLink={view.inviteLink}
        landingChannelName={view.textChannels[0]?.name ?? "general"}
        onCopyInviteLink={dialogs.copyServerInviteLink}
        onOpenChange={ui.setIsInviteOpen}
        open={ui.isInviteOpen}
      />

      <CreateChannelDialog
        access={dialogs.channelAccessDraft}
        categoryLabel={dialogs.channelCategoryLabelDraft}
        kind={dialogs.channelKindDraft}
        name={dialogs.channelNameDraft}
        onAccessChange={dialogs.setChannelAccessDraft}
        onKindChange={dialogs.setChannelKindDraft}
        onNameChange={dialogs.setChannelNameDraft}
        onOpenChange={ui.setIsCreateChannelOpen}
        onSubmit={dialogs.submitCreateChannel}
        open={ui.isCreateChannelOpen}
      />

      <RenameChannelDialog
        kind={dialogs.renameChannelKind}
        name={dialogs.renameChannelDraft}
        onNameChange={dialogs.setRenameChannelDraft}
        onOpenChange={ui.setIsRenameChannelOpen}
        onSubmit={dialogs.submitRenameChannel}
        open={ui.isRenameChannelOpen}
      />

      <WorkspaceCommandPalette />

      <WorkspaceRail />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-svh min-w-0 flex-1">
          <ResizablePanelGroup
            className="min-h-svh flex-1"
            orientation="horizontal"
          >
            <ResizablePanel
              defaultSize="22%"
              maxSize="26%"
              minSize="12%"
              panelRef={ui.leftSidebarRef}
            >
              <WorkspaceSidebar />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize="78%" minSize="40%">
              <main className="flex h-full min-w-0 flex-col bg-background">
                {showWorkspaceHeader ? <WorkspaceHeader /> : null}

                <div className="min-h-0 flex-1">
                  <WorkspaceMainContent />
                </div>

                {call.activeCall?.kind === "voice" ? (
                  <CallTray
                    activeCall={call.activeCall}
                    isConnecting={call.isCallConnecting}
                    onDeafen={call.toggleDeafen}
                    onLeave={call.leaveActiveCall}
                    onMute={call.toggleMute}
                    onShareScreen={call.triggerShareScreen}
                  />
                ) : null}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>

          {ui.isRightSidebarCollapsed ? null : (
            <div className="w-[340px] shrink-0">
              <WorkspaceRightSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
