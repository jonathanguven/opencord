import { useRef, useState } from "react";

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
  DeleteChannelDialog,
  OnboardingDialog,
  RenameChannelDialog,
} from "@/components/workspace/workspace-dialogs";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import {
  WorkspaceProfileDock,
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
import { useLocalStorageState } from "@/hooks/use-local-storage-state";

const LEFT_SIDEBAR_STORAGE_KEY = "workspace-left-sidebar-width";

export function WorkspaceScreen() {
  return (
    <WorkspaceScreenProvider>
      <WorkspaceScreenLayout />
    </WorkspaceScreenProvider>
  );
}

function WorkspaceScreenLayout() {
  const railWidth = 76;
  const view = useWorkspaceView();
  const ui = useWorkspaceUi();
  const dialogs = useWorkspaceDialogs();
  const call = useWorkspaceCall();
  const [leftSidebarWidth, setLeftSidebarWidth] = useLocalStorageState(
    LEFT_SIDEBAR_STORAGE_KEY,
    280,
    {
      deserialize: (storedValue) => Number(storedValue),
    }
  );
  const [liveLeftSidebarWidth, setLiveLeftSidebarWidth] =
    useState(leftSidebarWidth);
  const leftSidebarWidthRef = useRef(leftSidebarWidth);
  const showWorkspaceHeader =
    !view.isFriendsView || Boolean(view.activeConversationId);

  return (
    <div className="relative flex h-svh overflow-hidden bg-[#313338] text-[#f2f3f5]">
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

      <DeleteChannelDialog
        name={dialogs.deleteChannelName}
        onOpenChange={ui.setIsDeleteChannelOpen}
        onSubmit={dialogs.submitDeleteChannel}
        open={ui.isDeleteChannelOpen}
      />

      <WorkspaceCommandPalette />

      <WorkspaceRail />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1">
          <ResizablePanelGroup
            className="min-h-0 flex-1"
            onLayoutChanged={() => {
              setLeftSidebarWidth(leftSidebarWidthRef.current);
            }}
            orientation="horizontal"
          >
            <ResizablePanel
              defaultSize={leftSidebarWidth}
              groupResizeBehavior="preserve-pixel-size"
              maxSize={360}
              minSize={200}
              onResize={(panelSize) => {
                leftSidebarWidthRef.current = panelSize.inPixels;
                setLiveLeftSidebarWidth(panelSize.inPixels);
              }}
            >
              <WorkspaceSidebar />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel minSize={280}>
              <div className="flex h-full min-h-0 min-w-0 overflow-hidden">
                <main className="flex h-full min-w-0 flex-1 flex-col bg-background">
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

                {ui.isRightSidebarCollapsed ? null : (
                  <div className="w-[340px] shrink-0">
                    <WorkspaceRightSidebar />
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 z-30"
        style={{ width: `${railWidth + liveLeftSidebarWidth}px` }}
      >
        <div className="pointer-events-auto">
          <WorkspaceProfileDock />
        </div>
      </div>
    </div>
  );
}
