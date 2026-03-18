import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import type {
  ActiveCall,
  ConversationListItem,
  FriendsResult,
  MessageListItem,
  ServerListItem,
  VoicePresenceItem,
  WorkspaceResult,
} from "@/components/workspace/workspace-types";
import { useCloudflareSfuCall } from "@/hooks/use-cloudflare-sfu-call";
import {
  getChannelDisplayName,
  normalizeTextChannelName,
} from "@/lib/channel-name";
import { getErrorMessage } from "@/lib/errors";
import { normalizeHandleInput, validateHandle } from "@/lib/handles";
import { getDisplayName } from "@/lib/presentation";
import {
  buildInviteLink,
  canCreateInvites,
  getChannelPath,
  getDmPath,
  getServerPath,
  resolvePermissions,
  resolveServerLandingChannel,
  setLastVisitedChannel,
} from "@/lib/workspace";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { defaultPermissionSet } from "../../shared/domain";

type ChannelKind = Doc<"channels">["kind"];
type ChannelAccess = Doc<"channels">["access"];

const DEFAULT_INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const CHANNELS_PATH = "/channels";

const toVoiceCallState = (
  session: {
    callRoomId: Id<"callRooms">;
    channelId: Id<"channels">;
    currentDeafened?: boolean;
    currentMuted?: boolean;
    forcedDeafen?: boolean;
    forcedMute?: boolean;
    iceServers: Array<{
      credential?: string;
      urls: string[];
      username?: string;
    }>;
    roomKey: string;
    serverId: Id<"servers">;
  },
  label: string
): ActiveCall => ({
  callRoomId: session.callRoomId,
  channelId: session.channelId,
  deafened: Boolean(session.currentDeafened || session.forcedDeafen),
  iceServers: session.iceServers,
  kind: "voice",
  label,
  muted: Boolean(
    session.currentMuted ||
      session.forcedMute ||
      session.currentDeafened ||
      session.forcedDeafen
  ),
  roomKey: session.roomKey,
  serverId: session.serverId,
});

const expandPanel = (
  panelRef: React.RefObject<PanelImperativeHandle | null>,
  onExpanded: () => void
) => {
  panelRef.current?.expand();
  onExpanded();
};

const resolveActiveThread = ({
  activeChannel,
  activeConversation,
  isFriendsView,
}: {
  activeChannel: Doc<"channels"> | null;
  activeConversation: ConversationListItem | null;
  isFriendsView: boolean;
}) => {
  if (isFriendsView) {
    if (!activeConversation?._id) {
      return null;
    }

    return {
      threadId: activeConversation._id,
      threadType: "dm" as const,
    };
  }

  if (activeChannel?.kind !== "text") {
    return null;
  }

  return {
    threadId: activeChannel._id,
    threadType: "channel" as const,
  };
};

const resolveHeaderTitle = ({
  activeChannel,
  activeConversation,
  activeServer,
  isFriendsView,
}: {
  activeChannel: Doc<"channels"> | null;
  activeConversation: ConversationListItem | null;
  activeServer: Doc<"servers"> | null;
  isFriendsView: boolean;
}) => {
  if (isFriendsView) {
    return activeConversation?.otherUser
      ? getDisplayName(activeConversation.otherUser)
      : "Friends";
  }

  if (!activeChannel) {
    return activeServer?.name || "Server";
  }

  return activeChannel.kind === "text"
    ? getChannelDisplayName(activeChannel)
    : activeChannel.name;
};

const resolveHeaderSubtitle = ({
  activeConversation,
  activeServer,
  isFriendsView,
}: {
  activeConversation: ConversationListItem | null;
  activeServer: Doc<"servers"> | null;
  isFriendsView: boolean;
}) => {
  if (isFriendsView) {
    return (
      activeConversation?.latestMessage?.body ||
      "Direct messages with your trusted circle."
    );
  }

  return activeServer?.description ?? "";
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This controller is an intermediate extraction layer and is still being split into smaller hooks.
export function useWorkspaceScreenController() {
  const { signOut } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{
    channelId?: string;
    conversationId?: string;
    serverId?: string;
  }>();

  const leftSidebarRef = useRef<PanelImperativeHandle | null>(null);
  const rightSidebarRef = useRef<PanelImperativeHandle | null>(null);

  const current = useQuery(api.users.current, {});
  const servers = useQuery(api.servers.list, {}) as
    | ServerListItem[]
    | undefined;
  const friends = useQuery(api.friends.list, {}) as FriendsResult | undefined;
  const conversations = useQuery(api.conversations.list, {}) as
    | ConversationListItem[]
    | undefined;

  const bootstrapUser = useMutation(api.users.bootstrap);
  const createServer = useMutation(api.servers.create);
  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateByFriend
  );
  const sendFriendRequest = useMutation(api.friends.sendRequest);
  const respondToRequest = useMutation(api.friends.respondToRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const createInvite = useMutation(api.invites.create);
  const createChannel = useMutation(api.channels.create);
  const reorderChannels = useMutation(api.channels.reorder);
  const sendMessage = useMutation(api.messages.send);
  const editMessage = useMutation(api.messages.edit);
  const removeMessage = useMutation(api.messages.remove);
  const startDmCall = useMutation(api.calls.startDmCall);
  const endDmCall = useMutation(api.calls.endDmCall);
  const joinDmCall = useAction(api.calls.joinDmCall);
  const joinVoice = useAction(api.voice.joinVoice);
  const heartbeat = useMutation(api.voice.heartbeat);
  const updateSelfMedia = useMutation(api.voice.updateSelfMedia);
  const leaveVoice = useMutation(api.voice.leave);
  const moveMember = useMutation(api.voice.moveMember);
  const setMemberMute = useMutation(api.voice.setMemberMute);
  const setMemberDeafen = useMutation(api.voice.setMemberDeafen);

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [friendsTab, setFriendsTab] = useState("all");
  const [messageDraft, setMessageDraft] = useState("");
  const [editingMessageDraft, setEditingMessageDraft] = useState("");
  const [editingMessageId, setEditingMessageId] =
    useState<Id<"messages"> | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [handleDraft, setHandleDraft] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [serverNameDraft, setServerNameDraft] = useState("");
  const [serverDescriptionDraft, setServerDescriptionDraft] = useState("");
  const [friendHandleDraft, setFriendHandleDraft] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [channelCategoryLabelDraft, setChannelCategoryLabelDraft] =
    useState("Text Channels");
  const [channelNameDraft, setChannelNameDraft] = useState("");
  const [channelKindDraft, setChannelKindDraft] = useState<ChannelKind>("text");
  const [channelAccessDraft, setChannelAccessDraft] =
    useState<ChannelAccess>("public");

  const isDmRoute = location.pathname.startsWith(`${CHANNELS_PATH}/dm/`);
  const activeConversationId = isDmRoute
    ? ((params.conversationId ?? null) as Id<"conversations"> | null)
    : null;
  const activeServerId =
    !isDmRoute && params.serverId ? (params.serverId as Id<"servers">) : null;
  const routeChannelId =
    activeServerId && params.channelId
      ? (params.channelId as Id<"channels">)
      : null;
  const isFriendsView = !activeServerId;
  const isServerView = Boolean(activeServerId);

  const activeServer =
    activeServerId && servers
      ? (servers.find((entry) => entry.server?._id === activeServerId)
          ?.server ?? null)
      : null;
  const workspace = useQuery(
    api.servers.getWorkspace,
    activeServerId ? { serverId: activeServerId } : "skip"
  ) as WorkspaceResult | undefined;
  const activeCallWorkspace = useQuery(
    api.servers.getWorkspace,
    activeCall?.kind === "voice" ? { serverId: activeCall.serverId } : "skip"
  ) as WorkspaceResult | undefined;
  const voicePresence = useQuery(
    api.voice.listForServer,
    activeServerId ? { serverId: activeServerId } : "skip"
  ) as VoicePresenceItem[] | undefined;
  const invites = useQuery(
    api.invites.list,
    activeServerId && workspace && canCreateInvites(workspace)
      ? { serverId: activeServerId }
      : "skip"
  ) as Doc<"invites">[] | undefined;

  const activeConversation =
    activeConversationId && conversations
      ? (conversations.find(
          (conversation) => conversation._id === activeConversationId
        ) ?? null)
      : null;
  const activeChannel =
    routeChannelId && workspace
      ? (workspace.channels.find((channel) => channel._id === routeChannelId) ??
        null)
      : null;

  const activeThread = resolveActiveThread({
    activeChannel,
    activeConversation,
    isFriendsView,
  });
  const activeThreadKey = activeThread
    ? `${activeThread.threadType}:${activeThread.threadId}`
    : null;

  const messages = useQuery(
    api.messages.list,
    activeThread
      ? {
          limit: 100,
          threadId: activeThread.threadId,
          threadType: activeThread.threadType,
        }
      : "skip"
  ) as MessageListItem[] | undefined;

  const permissions = workspace
    ? resolvePermissions(workspace)
    : defaultPermissionSet();
  const voiceChannels =
    workspace?.channels.filter((channel) => channel.kind === "voice") ?? [];
  const textChannels =
    workspace?.channels.filter((channel) => channel.kind === "text") ?? [];
  const activeVoiceMembers =
    activeChannel?.kind === "voice" && voicePresence
      ? voicePresence.filter((state) => state.channelId === activeChannel._id)
      : [];

  const latestInvite = invites?.[invites.length - 1] ?? null;
  const inviteLink = latestInvite
    ? buildInviteLink(latestInvite.code)
    : "Generate a 7-day invite link";
  const headerTitle = resolveHeaderTitle({
    activeChannel,
    activeConversation,
    activeServer,
    isFriendsView,
  });
  const headerSubtitle = resolveHeaderSubtitle({
    activeConversation,
    activeServer,
    isFriendsView,
  });

  useEffect(() => {
    if (!current?.user) {
      return;
    }

    const user = current.user;
    setDisplayNameDraft((value) => value || getDisplayName(user));
    setHandleDraft((value) => value || user.handle || "");
  }, [current]);

  useEffect(() => {
    if (activeThreadKey === null) {
      setEditingMessageId(null);
      setEditingMessageDraft("");
      return;
    }

    setEditingMessageId(null);
    setEditingMessageDraft("");
  }, [activeThreadKey]);

  useEffect(() => {
    if (
      editingMessageId &&
      !messages?.some((message) => message._id === editingMessageId)
    ) {
      setEditingMessageId(null);
      setEditingMessageDraft("");
    }
  }, [editingMessageId, messages]);

  useEffect(() => {
    if (
      activeServerId &&
      servers &&
      !servers.some((entry) => entry.server?._id === activeServerId)
    ) {
      navigate(CHANNELS_PATH, { replace: true });
    }
  }, [activeServerId, navigate, servers]);

  useEffect(() => {
    if (
      activeConversationId &&
      conversations &&
      !conversations.some(
        (conversation) => conversation._id === activeConversationId
      )
    ) {
      navigate(CHANNELS_PATH, { replace: true });
    }
  }, [activeConversationId, conversations, navigate]);

  useEffect(() => {
    if (!(activeServerId && workspace)) {
      return;
    }

    const fallbackChannel = resolveServerLandingChannel(
      activeServerId,
      workspace.channels
    );

    if (!fallbackChannel) {
      navigate(CHANNELS_PATH, { replace: true });
      return;
    }

    if (!routeChannelId) {
      navigate(getChannelPath(activeServerId, fallbackChannel._id), {
        replace: true,
      });
      return;
    }

    if (!workspace.channels.some((channel) => channel._id === routeChannelId)) {
      navigate(getChannelPath(activeServerId, fallbackChannel._id), {
        replace: true,
      });
    }
  }, [activeServerId, navigate, routeChannelId, workspace]);

  useEffect(() => {
    if (activeServerId && activeChannel) {
      setLastVisitedChannel(activeServerId, activeChannel._id);
    }
  }, [activeChannel, activeServerId]);

  useEffect(() => {
    if (!activeCall || activeCall.kind !== "voice") {
      return;
    }

    const intervalId = window.setInterval(() => {
      heartbeat({
        channelId: activeCall.channelId,
        serverId: activeCall.serverId,
      }).catch(() => undefined);
    }, 25_000);

    return () => window.clearInterval(intervalId);
  }, [activeCall, heartbeat]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }

      if (event.key.toLowerCase() !== "b") {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        setIsRightSidebarCollapsed((currentValue) => !currentValue);
        return;
      }

      expandPanel(leftSidebarRef, () => setIsLeftSidebarCollapsed(false));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const moveToChannel = async (targetChannelId: Id<"channels">) => {
    const targetChannel =
      activeCallWorkspace?.channels.find(
        (channel) => channel._id === targetChannelId
      ) ?? null;
    if (!targetChannel || targetChannel.kind !== "voice") {
      return;
    }

    try {
      const session = await joinVoice({ channelId: targetChannel._id });
      setActiveCall(toVoiceCallState(session, `#${targetChannel.name}`));
      toast.success(`Moved to ${targetChannel.name}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const {
    isConnecting: isCallConnecting,
    leave: disconnectSfuCall,
    selfVoiceState,
  } = useCloudflareSfuCall({
    activeCall,
    currentUserId: current?.user?._id,
    onCallChange: (updater) => {
      setActiveCall((currentCall) => updater(currentCall));
    },
    onMoveToChannel: (channelId) => {
      moveToChannel(channelId).catch((error) =>
        toast.error(getErrorMessage(error))
      );
    },
  });

  const submitOnboarding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedHandle = normalizeHandleInput(handleDraft);
    const nextHandleError = validateHandle(normalizedHandle);

    setHandleDraft(normalizedHandle);
    setHandleError(nextHandleError);

    if (nextHandleError) {
      return;
    }

    try {
      await bootstrapUser({
        displayName: displayNameDraft,
        handle: normalizedHandle,
      });
      toast.success("Profile ready.");
    } catch (error) {
      const message = getErrorMessage(error);
      setHandleError(message);
      toast.error(message);
    }
  };

  const submitCreateServer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const serverId = await createServer({
        description: serverDescriptionDraft || undefined,
        name: serverNameDraft,
      });
      setIsCreateServerOpen(false);
      setServerDescriptionDraft("");
      setServerNameDraft("");
      navigate(getServerPath(serverId));
      toast.success("Server created.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const submitFriendRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const handle = friendHandleDraft.trim();

    if (!handle) {
      toast.error("Enter a handle to send a request.");
      return;
    }

    try {
      await sendFriendRequest({ handle });
      setFriendHandleDraft("");
      toast.success("Friend request sent.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const showAddFriendTab = () => {
    setFriendsTab("add");
    navigate(CHANNELS_PATH);
  };

  const submitCreateChannel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!(activeServerId && workspace)) {
      return;
    }

    try {
      const order =
        workspace.channels.reduce(
          (highest, channel) => Math.max(highest, channel.order),
          0
        ) + 10;

      const channelId = await createChannel({
        access: channelAccessDraft,
        kind: channelKindDraft,
        name:
          channelKindDraft === "text"
            ? normalizeTextChannelName(channelNameDraft)
            : channelNameDraft,
        order,
        serverId: activeServerId,
      });

      setChannelAccessDraft("public");
      setChannelKindDraft("text");
      setChannelNameDraft("");
      setIsCreateChannelOpen(false);
      navigate(getChannelPath(activeServerId, channelId));
      toast.success("Channel created.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openCreateChannel = (kind: ChannelKind, categoryLabel: string) => {
    setChannelKindDraft(kind);
    setChannelCategoryLabelDraft(categoryLabel);
    setChannelNameDraft("");
    setChannelAccessDraft("public");
    setIsCreateChannelOpen(true);
  };

  const reorderChannelSection = async (
    kind: ChannelKind,
    orderedSectionChannelIds: Id<"channels">[]
  ) => {
    if (!(activeServerId && workspace)) {
      return false;
    }

    const textChannelIds =
      kind === "text"
        ? orderedSectionChannelIds
        : textChannels.map((channel) => channel._id);
    const voiceChannelIds =
      kind === "voice"
        ? orderedSectionChannelIds
        : voiceChannels.map((channel) => channel._id);

    try {
      await reorderChannels({
        orderedChannelIds: [...textChannelIds, ...voiceChannelIds],
        serverId: activeServerId,
      });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const sendActiveMessage = async () => {
    if (!activeThread) {
      return;
    }

    try {
      await sendMessage({
        body: messageDraft,
        threadId: activeThread.threadId,
        threadType: activeThread.threadType,
      });
      setMessageDraft("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const editOwnMessage = (messageId: Id<"messages">) => {
    const message = messages?.find((entry) => entry._id === messageId);
    if (!(message && current?.user?._id === message.authorId)) {
      return false;
    }

    setEditingMessageId(message._id);
    setEditingMessageDraft(message.body);
    return true;
  };

  const editLatestOwnMessage = () => {
    if (!current?.user?._id) {
      return false;
    }

    const latestOwnMessage = [...(messages ?? [])]
      .reverse()
      .find((message) => message.authorId === current.user._id);

    if (!latestOwnMessage) {
      return false;
    }

    return editOwnMessage(latestOwnMessage._id);
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingMessageDraft("");
  };

  const submitEditingMessage = async () => {
    if (!editingMessageId) {
      return;
    }

    try {
      await editMessage({
        body: editingMessageDraft,
        messageId: editingMessageId,
      });
      setEditingMessageDraft("");
      setEditingMessageId(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteOwnMessage = async (messageId: Id<"messages">) => {
    const message = messages?.find((entry) => entry._id === messageId);
    if (!(message && current?.user?._id === message.authorId)) {
      return;
    }

    try {
      await removeMessage({ messageId });
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setEditingMessageDraft("");
      }
      toast.success("Message deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openConversation = async (friendId: Id<"users">) => {
    try {
      const conversationId = await getOrCreateConversation({ friendId });
      navigate(getDmPath(conversationId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const copyServerInviteLink = async () => {
    const existingInvite = invites?.[invites.length - 1];

    try {
      const code =
        existingInvite?.code ??
        (activeServerId
          ? (
              await createInvite({
                expiresAt: Date.now() + DEFAULT_INVITE_LIFETIME_MS,
                serverId: activeServerId,
              })
            ).code
          : null);
      if (!code) {
        return;
      }

      await navigator.clipboard.writeText(buildInviteLink(code));
      toast.success(
        existingInvite
          ? "Invite link copied."
          : "Invite link created and copied."
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const startConversationCall = async () => {
    if (!(activeConversationId && activeConversation?.otherUser)) {
      return;
    }

    try {
      await startDmCall({ conversationId: activeConversationId });
      const session = await joinDmCall({
        conversationId: activeConversationId,
      });
      setActiveCall({
        callRoomId: session.callRoomId,
        conversationId: activeConversationId,
        deafened: false,
        iceServers: session.iceServers,
        kind: "dm",
        label: `DM with ${getDisplayName(activeConversation.otherUser)}`,
        muted: false,
        roomKey: session.roomKey,
      });
      toast.success("Connecting DM call...");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const joinVoiceChannel = async (channel: Doc<"channels">) => {
    try {
      const session = await joinVoice({ channelId: channel._id });
      setActiveCall(toVoiceCallState(session, `#${channel.name}`));
      toast.success(`Connecting to ${channel.name}...`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const leaveActiveCall = async () => {
    if (!activeCall) {
      return;
    }

    try {
      await disconnectSfuCall();
      if (activeCall.kind === "voice") {
        await leaveVoice({});
      } else {
        await endDmCall({ conversationId: activeCall.conversationId });
      }
      setActiveCall(null);
      toast.success("Call ended.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleMute = async () => {
    if (!activeCall) {
      return;
    }

    if (activeCall.kind === "voice" && selfVoiceState?.forcedMute) {
      toast.error("A moderator has muted you.");
      return;
    }

    const nextMuted = !activeCall.muted;
    setActiveCall({ ...activeCall, muted: nextMuted });

    if (activeCall.kind === "voice") {
      try {
        await updateSelfMedia({
          deafened: activeCall.deafened,
          muted: nextMuted,
        });
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const toggleDeafen = async () => {
    if (!activeCall) {
      return;
    }

    if (activeCall.kind === "voice" && selfVoiceState?.forcedDeafen) {
      toast.error("A moderator has deafened you.");
      return;
    }

    const nextDeafened = !activeCall.deafened;
    setActiveCall({
      ...activeCall,
      deafened: nextDeafened,
      muted: activeCall.muted || nextDeafened,
    });

    if (activeCall.kind === "voice") {
      try {
        await updateSelfMedia({
          deafened: nextDeafened,
          muted: activeCall.muted || nextDeafened,
        });
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const triggerShareScreen = () => {
    toast("Screen share is not part of the SFU audio rollout yet.");
  };

  const setOnboardingHandleDraft = (value: string) => {
    const normalizedValue = normalizeHandleInput(value);
    setHandleDraft(normalizedValue);
    if (handleError) {
      setHandleError(null);
    }
  };

  const toggleLeftSidebar = () => {
    expandPanel(leftSidebarRef, () => setIsLeftSidebarCollapsed(false));
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed((currentValue) => !currentValue);
  };

  const acceptFriendRequest = (requestId: Id<"friendRequests">) => {
    respondToRequest({ accept: true, requestId }).then(
      () => toast.success("Friend request accepted."),
      (error) => toast.error(getErrorMessage(error))
    );
  };

  const declineFriendRequest = (requestId: Id<"friendRequests">) => {
    respondToRequest({ accept: false, requestId }).then(
      () => toast.success("Friend request declined."),
      (error) => toast.error(getErrorMessage(error))
    );
  };

  const removeFriendship = (friendId: Id<"users">) => {
    removeFriend({ friendId }).then(
      () => toast.success("Friend removed."),
      (error) => toast.error(getErrorMessage(error))
    );
  };

  const forceDeafenMember = (
    memberUserId: Id<"users">,
    forcedDeafen: boolean
  ) => {
    if (!activeServerId) {
      return;
    }

    setMemberDeafen({
      forcedDeafen,
      memberUserId,
      serverId: activeServerId,
    }).then(
      () =>
        toast.success(forcedDeafen ? "Member deafened." : "Member undeafened."),
      (error) => toast.error(getErrorMessage(error))
    );
  };

  const forceMuteMember = (memberUserId: Id<"users">, forcedMute: boolean) => {
    if (!activeServerId) {
      return;
    }

    setMemberMute({
      forcedMute,
      memberUserId,
      serverId: activeServerId,
    }).then(
      () => toast.success(forcedMute ? "Member muted." : "Member unmuted."),
      (error) => toast.error(getErrorMessage(error))
    );
  };

  const moveWorkspaceMember = (
    memberUserId: Id<"users">,
    targetChannelId: Id<"channels">
  ) => {
    if (!activeServerId) {
      return;
    }

    moveMember({
      memberUserId,
      serverId: activeServerId,
      targetChannelId,
    }).then(
      () => toast.success("Move request sent."),
      (error) => toast.error(getErrorMessage(error))
    );
  };

  return {
    acceptFriendRequest,
    activeCall,
    activeChannel,
    activeConversation,
    activeConversationId,
    activeServer,
    activeServerId,
    activeVoiceMembers,
    canCreateServerInvites: isServerView && canCreateInvites(workspace),
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
    editingMessageDraft,
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
    rightSidebarRef,
    routeChannelId,
    reorderChannelSection,
    sendActiveMessage,
    setEditingMessageDraft,
    serverDescriptionDraft,
    serverNameDraft,
    servers,
    setChannelAccessDraft,
    setChannelKindDraft,
    setChannelNameDraft,
    setDisplayNameDraft,
    setFriendHandleDraft,
    setFriendsTab,
    setHandleDraft: setOnboardingHandleDraft,
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
    submitEditingMessage,
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
  };
}
