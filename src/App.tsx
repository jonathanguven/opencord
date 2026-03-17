import { useEffect, useRef, useState, type FormEvent } from "react"
import { useAuthActions } from "@convex-dev/auth/react"
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useAction,
  useMutation,
  useQuery,
} from "convex/react"
import { toast } from "sonner"
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"
import {
  AudioLinesIcon,
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  HashIcon,
  Loader2Icon,
  LogOutIcon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  MonitorUpIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  ShieldIcon,
  UserPlusIcon,
  UsersIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react"
import type { PanelImperativeHandle } from "react-resizable-panels"

import { api } from "../convex/_generated/api"
import type { Doc, Id } from "../convex/_generated/dataModel"
import { defaultPermissionSet, type PermissionSet } from "../shared/domain"
import { mergePermissionSets } from "../shared/permissions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCloudflareSfuCall } from "@/hooks/use-cloudflare-sfu-call"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type AppProps = {
  missingConvexUrl?: boolean
}

type ServerListItem = Doc<"serverMembers"> & {
  server: Doc<"servers"> | null
}

type FriendLite = {
  _id: Id<"users">
  handle?: string | null
  displayName?: string | null
  avatarUrl?: string | null
}

type FriendsResult = {
  friends: FriendLite[]
  incoming: Array<Doc<"friendRequests"> & { fromUser: Doc<"users"> | null }>
  outgoing: Array<Doc<"friendRequests"> & { toUser: Doc<"users"> | null }>
}

type MessageListItem = Doc<"messages"> & {
  author: Doc<"users"> | null
}

type ConversationListItem = Doc<"conversations"> & {
  otherUser: Doc<"users"> | null
  latestMessage: Doc<"messages"> | null
  activeCall: Doc<"dmCallSessions"> | null
}

type VoicePresenceItem = Doc<"activeVoiceStates"> & {
  user: Doc<"users"> | null
}

type WorkspaceResult = {
  server: Doc<"servers"> | null
  membership: Doc<"serverMembers">
  roles: Doc<"roles">[]
  channels: Doc<"channels">[]
  members: Array<Doc<"serverMembers"> & { user: Doc<"users"> | null }>
  voiceStates: Doc<"activeVoiceStates">[]
}

type ActiveCall =
  | {
      callRoomId: Id<"callRooms">
      deafened: boolean
      iceServers: Array<{
        credential?: string
        urls: string[]
        username?: string
      }>
      kind: "voice"
      channelId: Id<"channels">
      label: string
      muted: boolean
      roomKey: string
      serverId: Id<"servers">
      sessionId?: string
    }
  | {
      callRoomId: Id<"callRooms">
      deafened: boolean
      iceServers: Array<{
        credential?: string
        urls: string[]
        username?: string
      }>
      kind: "dm"
      conversationId: Id<"conversations">
      label: string
      muted: boolean
      roomKey: string
      sessionId?: string
    }

type ChannelKind = Doc<"channels">["kind"]
type ChannelAccess = Doc<"channels">["access"]

const DEFAULT_INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000
const CHANNELS_PATH = "/channels"
const LAST_CHANNEL_STORAGE_KEY_PREFIX = "opencord:last-channel:"

export default function App({ missingConvexUrl = false }: AppProps) {
  if (missingConvexUrl) {
    return <MissingConvexScreen />
  }

  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <SignInScreen />
      </Unauthenticated>
      <Authenticated>
        <Routes>
          <Route element={<WorkspaceScreen />} path={CHANNELS_PATH} />
          <Route
            element={<WorkspaceScreen />}
            path={`${CHANNELS_PATH}/dm/:conversationId`}
          />
          <Route
            element={<WorkspaceScreen />}
            path={`${CHANNELS_PATH}/:serverId`}
          />
          <Route
            element={<WorkspaceScreen />}
            path={`${CHANNELS_PATH}/:serverId/:channelId`}
          />
          <Route element={<InvitePlaceholderScreen />} path="/invite/:code" />
          <Route element={<Navigate replace to={CHANNELS_PATH} />} path="*" />
        </Routes>
      </Authenticated>
    </>
  )
}

function MissingConvexScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-2xl border-border/70 bg-card/90 shadow-2xl">
        <CardHeader>
          <Badge variant="secondary">Frontend setup required</Badge>
          <CardTitle>Set `VITE_CONVEX_URL` to boot the new Vite app</CardTitle>
          <CardDescription>
            The shadcn Vite frontend is ready, but the browser client still
            needs the Convex deployment URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <AudioLinesIcon />
            <AlertTitle>Required environment variable</AlertTitle>
            <AlertDescription>
              Add `VITE_CONVEX_URL=https://your-deployment.convex.cloud` to your
              env file, then install packages and start the dev server.
            </AlertDescription>
          </Alert>
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 font-mono text-sm text-muted-foreground">
            VITE_CONVEX_URL=
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <div className="flex w-18 flex-col items-center gap-3 border-r border-border/60 bg-sidebar px-3 py-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="size-12 rounded-2xl" />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_260px]">
        {Array.from({ length: 3 }).map((_, column) => (
          <div
            key={column}
            className="flex flex-col gap-4 border-r border-border/60 p-4 last:border-r-0"
          >
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SignInScreen() {
  const { signIn } = useAuthActions()
  const [isPending, setIsPending] = useState<string | null>(null)

  const startSignIn = async (provider: "discord" | "google" | "anonymous") => {
    setIsPending(provider)

    try {
      await signIn(provider, { redirectTo: window.location.href })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsPending(null)
    }
  }

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(88,101,242,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(87,242,135,0.15),transparent_24%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_86%,var(--primary)_14%))] p-6 text-foreground">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-7xl items-center justify-center">
        <ResizablePanelGroup
          className="min-h-[680px] w-full overflow-hidden rounded-[28px] border border-border/60 bg-card/85 shadow-2xl"
          orientation="horizontal"
        >
          <ResizablePanel defaultSize="54%" minSize="40%">
            <div className="flex h-full flex-col justify-between bg-sidebar/80 p-8">
              <div className="flex flex-col gap-6">
                <Badge className="w-fit" variant="secondary">
                  Privacy-first voice and text
                </Badge>
                <div className="flex flex-col gap-3">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    OpenCord, rebuilt on a shadcn + Vite backbone.
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground">
                    A Discord-style workspace for private gaming groups with
                    invite-only servers, reactive chat, and a persistent call
                    tray.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      description:
                        "DMs and channel threads stay in sync through Convex subscriptions.",
                      icon: MessageSquareIcon,
                      title: "Reactive text threads",
                    },
                    {
                      description:
                        "No public discovery layer, just direct friends, invites, and roles.",
                      icon: UsersIcon,
                      title: "Private communities",
                    },
                    {
                      description:
                        "Voice rooms, DM calls, and screen-share controls live in the main shell.",
                      icon: AudioLinesIcon,
                      title: "Voice-ready shell",
                    },
                    {
                      description:
                        "Built for groups that want communication tools without ad-tech baggage.",
                      icon: ShieldIcon,
                      title: "Minimal telemetry",
                    },
                  ].map((item) => (
                    <Card key={item.title} className="bg-background/70">
                      <CardHeader>
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <item.icon />
                        </div>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BellIcon />
                Press `d` anytime to flip the theme.
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="46%" minSize="32%">
            <div className="flex h-full items-center justify-center p-6">
              <Card className="w-full max-w-lg bg-background/95">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">
                    Sign in
                  </Badge>
                  <CardTitle>Join your private gaming circle</CardTitle>
                  <CardDescription>
                    OAuth buttons use the providers configured on the backend.
                    Guest mode always works for local testing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button
                    className="w-full justify-center"
                    disabled={Boolean(isPending)}
                    size="lg"
                    onClick={() => void startSignIn("discord")}
                  >
                    {isPending === "discord" ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <MessageSquareIcon data-icon="inline-start" />
                    )}
                    Continue with Discord
                  </Button>
                  <Button
                    className="w-full justify-center"
                    disabled={Boolean(isPending)}
                    size="lg"
                    variant="secondary"
                    onClick={() => void startSignIn("google")}
                  >
                    {isPending === "google" ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <SearchIcon data-icon="inline-start" />
                    )}
                    Continue with Google
                  </Button>
                  <Button
                    className="w-full justify-center"
                    disabled={Boolean(isPending)}
                    size="lg"
                    variant="outline"
                    onClick={() => void startSignIn("anonymous")}
                  >
                    {isPending === "anonymous" ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <UsersIcon data-icon="inline-start" />
                    )}
                    Use local guest mode
                  </Button>
                </CardContent>
                <CardFooter className="justify-between gap-3 text-sm text-muted-foreground">
                  <span>Invite-only communities. No public discovery.</span>
                  <Badge variant="secondary">MVP shell</Badge>
                </CardFooter>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

function WorkspaceScreen() {
  const { signOut } = useAuthActions()
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{
    channelId?: string
    conversationId?: string
    serverId?: string
  }>()
  const leftSidebarRef = useRef<PanelImperativeHandle | null>(null)
  const rightSidebarRef = useRef<PanelImperativeHandle | null>(null)

  const current = useQuery(api.users.current, {})
  const servers = useQuery(api.servers.list, {}) as ServerListItem[] | undefined
  const friends = useQuery(api.friends.list, {}) as FriendsResult | undefined
  const conversations = useQuery(api.conversations.list, {}) as
    | ConversationListItem[]
    | undefined

  const bootstrapUser = useMutation(api.users.bootstrap)
  const createServer = useMutation(api.servers.create)
  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateByFriend
  )
  const sendFriendRequest = useMutation(api.friends.sendRequest)
  const respondToRequest = useMutation(api.friends.respondToRequest)
  const removeFriend = useMutation(api.friends.removeFriend)
  const createInvite = useMutation(api.invites.create)
  const createChannel = useMutation(api.channels.create)
  const sendMessage = useMutation(api.messages.send)
  const startDmCall = useMutation(api.calls.startDmCall)
  const endDmCall = useMutation(api.calls.endDmCall)
  const joinDmCall = useAction(api.calls.joinDmCall)
  const joinVoice = useAction(api.voice.joinVoice)
  const heartbeat = useMutation(api.voice.heartbeat)
  const updateSelfMedia = useMutation(api.voice.updateSelfMedia)
  const leaveVoice = useMutation(api.voice.leave)
  const moveMember = useMutation(api.voice.moveMember)
  const setMemberMute = useMutation(api.voice.setMemberMute)
  const setMemberDeafen = useMutation(api.voice.setMemberDeafen)

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false)
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false)
  const [friendsTab, setFriendsTab] = useState("all")
  const [messageDraft, setMessageDraft] = useState("")

  const [displayNameDraft, setDisplayNameDraft] = useState("")
  const [handleDraft, setHandleDraft] = useState("")
  const [handleError, setHandleError] = useState<string | null>(null)

  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false)
  const [serverNameDraft, setServerNameDraft] = useState("")
  const [serverDescriptionDraft, setServerDescriptionDraft] = useState("")

  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [friendHandleDraft, setFriendHandleDraft] = useState("")

  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [channelNameDraft, setChannelNameDraft] = useState("")
  const [channelKindDraft, setChannelKindDraft] = useState<ChannelKind>("text")
  const [channelAccessDraft, setChannelAccessDraft] =
    useState<ChannelAccess>("public")

  const isDmRoute = location.pathname.startsWith(`${CHANNELS_PATH}/dm/`)
  const activeConversationId = isDmRoute
    ? ((params.conversationId ?? null) as Id<"conversations"> | null)
    : null
  const activeServerId =
    !isDmRoute && params.serverId ? (params.serverId as Id<"servers">) : null
  const routeChannelId =
    activeServerId && params.channelId
      ? (params.channelId as Id<"channels">)
      : null
  const isFriendsView = !activeServerId
  const isServerView = Boolean(activeServerId)
  const activeServer =
    activeServerId && servers
      ? (servers.find((entry) => entry.server?._id === activeServerId)
          ?.server ?? null)
      : null
  const workspace = useQuery(
    api.servers.getWorkspace,
    activeServerId ? { serverId: activeServerId } : "skip"
  ) as WorkspaceResult | undefined
  const activeCallWorkspace = useQuery(
    api.servers.getWorkspace,
    activeCall?.kind === "voice" ? { serverId: activeCall.serverId } : "skip"
  ) as WorkspaceResult | undefined
  const voicePresence = useQuery(
    api.voice.listForServer,
    activeServerId ? { serverId: activeServerId } : "skip"
  ) as VoicePresenceItem[] | undefined
  const invites = useQuery(
    api.invites.list,
    activeServerId && workspace && canCreateInvites(workspace)
      ? { serverId: activeServerId }
      : "skip"
  ) as Doc<"invites">[] | undefined

  const activeConversation =
    activeConversationId && conversations
      ? (conversations.find(
          (conversation) => conversation._id === activeConversationId
        ) ?? null)
      : null
  const activeChannel =
    routeChannelId && workspace
      ? (workspace.channels.find((channel) => channel._id === routeChannelId) ??
        null)
      : null
  const activeThread = isFriendsView
    ? activeConversation?._id
      ? { threadType: "dm" as const, threadId: activeConversation._id }
      : null
    : activeChannel?.kind === "text"
      ? { threadType: "channel" as const, threadId: activeChannel._id }
      : null
  const messages = useQuery(
    api.messages.list,
    activeThread
      ? {
          limit: 100,
          threadId: activeThread.threadId,
          threadType: activeThread.threadType,
        }
      : "skip"
  ) as MessageListItem[] | undefined

  useEffect(() => {
    if (!current?.user) {
      return
    }

    const user = current.user

    setDisplayNameDraft((value) => value || getDisplayName(user))
    setHandleDraft((value) => value || user.handle || "")
  }, [current])

  useEffect(() => {
    if (!servers || !activeServerId) {
      return
    }

    if (!servers.some((entry) => entry.server?._id === activeServerId)) {
      navigate(CHANNELS_PATH, { replace: true })
    }
  }, [activeServerId, navigate, servers])

  useEffect(() => {
    if (!conversations || !activeConversationId) {
      return
    }

    if (
      !conversations.some(
        (conversation) => conversation._id === activeConversationId
      )
    ) {
      navigate(CHANNELS_PATH, { replace: true })
    }
  }, [activeConversationId, conversations, navigate])

  useEffect(() => {
    if (!activeServerId || !workspace) {
      return
    }

    const fallbackChannel = resolveServerLandingChannel(
      activeServerId,
      workspace.channels
    )

    if (!fallbackChannel) {
      navigate(CHANNELS_PATH, { replace: true })
      return
    }

    if (!routeChannelId) {
      navigate(getChannelPath(activeServerId, fallbackChannel._id), {
        replace: true,
      })
      return
    }

    if (workspace.channels.some((channel) => channel._id === routeChannelId)) {
      return
    }

    navigate(getChannelPath(activeServerId, fallbackChannel._id), {
      replace: true,
    })
  }, [activeServerId, navigate, routeChannelId, workspace])

  useEffect(() => {
    if (!activeServerId || !activeChannel) {
      return
    }

    setLastVisitedChannel(activeServerId, activeChannel._id)
  }, [activeChannel, activeServerId])

  useEffect(() => {
    if (!activeCall || activeCall.kind !== "voice") {
      return
    }

    const intervalId = window.setInterval(() => {
      void heartbeat({
        channelId: activeCall.channelId,
        serverId: activeCall.serverId,
      }).catch(() => undefined)
    }, 25_000)

    return () => window.clearInterval(intervalId)
  }, [activeCall, heartbeat])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "b") {
        return
      }

      event.preventDefault()

      if (event.shiftKey) {
        if (rightSidebarRef.current?.isCollapsed()) {
          rightSidebarRef.current.expand()
          setIsRightSidebarCollapsed(false)
        } else {
          rightSidebarRef.current?.collapse()
          setIsRightSidebarCollapsed(true)
        }
        return
      }

      if (leftSidebarRef.current?.isCollapsed()) {
        leftSidebarRef.current.expand()
        setIsLeftSidebarCollapsed(false)
      } else {
        leftSidebarRef.current?.collapse()
        setIsLeftSidebarCollapsed(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const permissions = workspace
    ? resolvePermissions(workspace)
    : defaultPermissionSet()
  const voiceChannels =
    workspace?.channels.filter((channel) => channel.kind === "voice") ?? []
  const textChannels =
    workspace?.channels.filter((channel) => channel.kind === "text") ?? []
  const activeVoiceMembers =
    activeChannel?.kind === "voice" && voicePresence
      ? voicePresence.filter((state) => state.channelId === activeChannel._id)
      : []

  const moveToChannel = async (targetChannelId: Id<"channels">) => {
    const targetChannel =
      activeCallWorkspace?.channels.find((channel) => channel._id === targetChannelId) ??
      null
    if (!targetChannel || targetChannel.kind !== "voice") {
      return
    }

    try {
      const session = await joinVoice({ channelId: targetChannel._id })
      setActiveCall({
        callRoomId: session.callRoomId,
        channelId: session.channelId,
        deafened: session.currentDeafened || session.forcedDeafen,
        iceServers: session.iceServers,
        kind: "voice",
        label: `#${targetChannel.name}`,
        muted:
          session.currentMuted ||
          session.forcedMute ||
          session.currentDeafened ||
          session.forcedDeafen,
        roomKey: session.roomKey,
        serverId: session.serverId,
      })
      toast.success(`Moved to ${targetChannel.name}.`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const { isConnecting: isCallConnecting, leave: disconnectSfuCall, selfVoiceState } =
    useCloudflareSfuCall({
      activeCall,
      currentUserId: current?.user?._id,
      onCallChange: (updater) => {
        setActiveCall((currentCall) => updater(currentCall))
      },
      onMoveToChannel: (channelId) => {
        void moveToChannel(channelId)
      },
    })

  const submitOnboarding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHandleError(null)

    try {
      await bootstrapUser({
        displayName: displayNameDraft,
        handle: handleDraft,
      })
      toast.success("Profile ready.")
    } catch (error) {
      const message = getErrorMessage(error)
      setHandleError(message)
      toast.error(message)
    }
  }

  const submitCreateServer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const serverId = await createServer({
        description: serverDescriptionDraft || undefined,
        name: serverNameDraft,
      })
      setIsCreateServerOpen(false)
      setServerDescriptionDraft("")
      setServerNameDraft("")
      navigate(getServerPath(serverId))
      toast.success("Server created.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const submitFriendRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await sendFriendRequest({ handle: friendHandleDraft })
      setFriendHandleDraft("")
      setIsAddFriendOpen(false)
      toast.success("Friend request sent.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const submitCreateChannel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeServerId || !workspace) {
      return
    }

    try {
      const order =
        workspace.channels.reduce(
          (highest, channel) => Math.max(highest, channel.order),
          0
        ) + 10

      const channelId = await createChannel({
        access: channelAccessDraft,
        kind: channelKindDraft,
        name: channelNameDraft,
        order,
        serverId: activeServerId,
      })

      setChannelAccessDraft("public")
      setChannelKindDraft("text")
      setChannelNameDraft("")
      setIsCreateChannelOpen(false)
      navigate(getChannelPath(activeServerId, channelId))
      toast.success("Channel created.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const sendActiveMessage = async () => {
    if (!activeThread) {
      return
    }

    try {
      await sendMessage({
        body: messageDraft,
        threadId: activeThread.threadId,
        threadType: activeThread.threadType,
      })
      setMessageDraft("")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const openConversation = async (friendId: Id<"users">) => {
    try {
      const conversationId = await getOrCreateConversation({ friendId })
      navigate(getDmPath(conversationId))
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const createFreshInvite = async () => {
    if (!activeServerId) {
      return
    }

    try {
      const result = await createInvite({
        expiresAt: Date.now() + DEFAULT_INVITE_LIFETIME_MS,
        serverId: activeServerId,
      })
      return result.code
    } catch (error) {
      toast.error(getErrorMessage(error))
      return null
    }
  }

  const copyServerInviteLink = async () => {
    const existingInvite = invites?.[invites.length - 1]

    try {
      const code = existingInvite?.code ?? (await createFreshInvite())
      if (!code) {
        return
      }

      await navigator.clipboard.writeText(buildInviteLink(code))
      toast.success(
        existingInvite
          ? "Invite link copied."
          : "Invite link created and copied."
      )
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const startConversationCall = async () => {
    if (!activeConversationId || !activeConversation?.otherUser) {
      return
    }

    try {
      await startDmCall({ conversationId: activeConversationId })
      const session = await joinDmCall({ conversationId: activeConversationId })
      setActiveCall({
        callRoomId: session.callRoomId,
        kind: "dm",
        conversationId: activeConversationId,
        deafened: false,
        iceServers: session.iceServers,
        label: `DM with ${getDisplayName(activeConversation.otherUser)}`,
        muted: false,
        roomKey: session.roomKey,
      })
      toast.success("Connecting DM call...")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const joinVoiceChannel = async (channel: Doc<"channels">) => {
    try {
      const session = await joinVoice({ channelId: channel._id })
      setActiveCall({
        callRoomId: session.callRoomId,
        kind: "voice",
        channelId: session.channelId,
        deafened: session.currentDeafened || session.forcedDeafen,
        iceServers: session.iceServers,
        label: `#${channel.name}`,
        muted:
          session.currentMuted ||
          session.forcedMute ||
          session.currentDeafened ||
          session.forcedDeafen,
        roomKey: session.roomKey,
        serverId: session.serverId,
      })
      toast.success(`Connecting to ${channel.name}...`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const leaveActiveCall = async () => {
    if (!activeCall) {
      return
    }

    try {
      await disconnectSfuCall()
      if (activeCall.kind === "voice") {
        await leaveVoice({})
      } else {
        await endDmCall({ conversationId: activeCall.conversationId })
      }
      setActiveCall(null)
      toast.success("Call ended.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const toggleMute = async () => {
    if (!activeCall) {
      return
    }

    if (activeCall.kind === "voice" && selfVoiceState?.forcedMute) {
      toast.error("A moderator has muted you.")
      return
    }

    const nextMuted = !activeCall.muted
    setActiveCall({ ...activeCall, muted: nextMuted })

    if (activeCall.kind === "voice") {
      try {
        await updateSelfMedia({
          deafened: activeCall.deafened,
          muted: nextMuted,
        })
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    }
  }

  const toggleDeafen = async () => {
    if (!activeCall) {
      return
    }

    if (activeCall.kind === "voice" && selfVoiceState?.forcedDeafen) {
      toast.error("A moderator has deafened you.")
      return
    }

    const nextDeafened = !activeCall.deafened
    setActiveCall({
      ...activeCall,
      deafened: nextDeafened,
      muted: activeCall.muted || nextDeafened,
    })

    if (activeCall.kind === "voice") {
      try {
        await updateSelfMedia({
          deafened: nextDeafened,
          muted: activeCall.muted || nextDeafened,
        })
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const triggerShareScreen = () => {
    toast("Screen share is not part of the SFU audio rollout yet.")
  }

  const toggleLeftSidebar = () => {
    if (leftSidebarRef.current?.isCollapsed()) {
      leftSidebarRef.current.expand()
      setIsLeftSidebarCollapsed(false)
      return
    }

    leftSidebarRef.current?.collapse()
    setIsLeftSidebarCollapsed(true)
  }

  const toggleRightSidebar = () => {
    if (rightSidebarRef.current?.isCollapsed()) {
      rightSidebarRef.current.expand()
      setIsRightSidebarCollapsed(false)
      return
    }

    rightSidebarRef.current?.collapse()
    setIsRightSidebarCollapsed(true)
  }

  const headerTitle = isFriendsView
    ? activeConversation?.otherUser
      ? getDisplayName(activeConversation.otherUser)
      : "Friends"
    : activeChannel
      ? activeChannel.kind === "text"
        ? `#${activeChannel.name}`
        : activeChannel.name
      : activeServer?.name || "Server"
  const headerSubtitle = isFriendsView
    ? activeConversation?.latestMessage?.body ||
      "Direct messages with your trusted circle."
    : activeServer?.description ||
      "Invite-only workspace with text channels, voice rooms, and private access."

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <OnboardingDialog
        current={current}
        displayNameDraft={displayNameDraft}
        handleDraft={handleDraft}
        handleError={handleError}
        onDisplayNameChange={setDisplayNameDraft}
        onHandleChange={setHandleDraft}
        onSubmit={submitOnboarding}
      />

      <CreateServerDialog
        description={serverDescriptionDraft}
        name={serverNameDraft}
        onDescriptionChange={setServerDescriptionDraft}
        onNameChange={setServerNameDraft}
        onOpenChange={setIsCreateServerOpen}
        onSubmit={submitCreateServer}
        open={isCreateServerOpen}
      />

      <AddFriendDialog
        handle={friendHandleDraft}
        onHandleChange={setFriendHandleDraft}
        onOpenChange={setIsAddFriendOpen}
        onSubmit={submitFriendRequest}
        open={isAddFriendOpen}
      />

      <InviteDialog
        activeServer={activeServer}
        friends={friends?.friends ?? []}
        landingChannelName={textChannels[0]?.name ?? "general"}
        invites={invites ?? []}
        onCopyInviteLink={() => void copyServerInviteLink()}
        onOpenChange={setIsInviteOpen}
        open={isInviteOpen}
      />

      <CreateChannelDialog
        access={channelAccessDraft}
        kind={channelKindDraft}
        name={channelNameDraft}
        onAccessChange={setChannelAccessDraft}
        onKindChange={setChannelKindDraft}
        onNameChange={setChannelNameDraft}
        onOpenChange={setIsCreateChannelOpen}
        onSubmit={submitCreateChannel}
        open={isCreateChannelOpen}
      />

      <div className="flex w-18 shrink-0 flex-col justify-between border-r border-border/60 bg-sidebar px-3 py-4">
        <div className="flex flex-col items-center gap-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className={cn(
                    "size-12 rounded-2xl",
                    isFriendsView && "bg-primary text-primary-foreground"
                  )}
                  size="icon-lg"
                  variant={isFriendsView ? "default" : "secondary"}
                />
              }
              onClick={() => navigate(CHANNELS_PATH)}
            >
              <MessageSquareIcon />
            </TooltipTrigger>
            <TooltipContent side="right">Friends & DMs</TooltipContent>
          </Tooltip>

          <Separator className="w-10" />

          <ScrollArea className="max-h-[calc(100svh-14rem)]">
            <div className="flex flex-col items-center gap-3">
              {servers?.map((entry) => {
                if (!entry.server) {
                  return null
                }

                const server = entry.server
                const isActive = activeServerId === server._id

                return (
                  <Tooltip key={server._id}>
                    <TooltipTrigger
                      render={
                        <Button
                          className={cn(
                            "size-12 rounded-2xl bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80",
                            isActive && "bg-primary text-primary-foreground"
                          )}
                          size="icon-lg"
                          variant="ghost"
                        />
                      }
                      onClick={() => navigate(getServerPath(server._id))}
                    >
                      <span className="text-sm font-semibold">
                        {getInitials(server.name)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">{server.name}</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </ScrollArea>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="size-12 rounded-2xl"
                  size="icon-lg"
                  variant="outline"
                />
              }
              onClick={() => setIsCreateServerOpen(true)}
            >
              <PlusIcon />
            </TooltipTrigger>
            <TooltipContent side="right">Create server</TooltipContent>
          </Tooltip>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="h-auto rounded-2xl p-2" variant="ghost" />
            }
          >
            <Avatar>
              <AvatarImage src={current?.user?.avatarUrl ?? undefined} />
              <AvatarFallback>
                {getInitials(getDisplayName(current?.user))}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="right">
            <DropdownMenuLabel>
              {getDisplayName(current?.user)}
              <div className="text-xs font-normal text-muted-foreground">
                @{current?.user?.handle ?? "finish-setup"}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setIsAddFriendOpen(true)}>
                <UserPlusIcon />
                Add friend
              </DropdownMenuItem>
              {isServerView && canCreateInvites(workspace) ? (
                <DropdownMenuItem onClick={() => setIsInviteOpen(true)}>
                  <CopyIcon />
                  Create invite
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => void handleSignOut()}>
                <LogOutIcon />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <ResizablePanelGroup orientation="horizontal" className="min-h-svh">
          <ResizablePanel
            collapsible
            collapsedSize="0%"
            defaultSize="18%"
            maxSize="26%"
            minSize="12%"
            panelRef={leftSidebarRef}
            onResize={(size) =>
              setIsLeftSidebarCollapsed(size.asPercentage === 0)
            }
          >
            <aside className="flex h-full flex-col border-r border-border/60 bg-sidebar/70">
              <div className="border-b border-border/60 p-3">
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput placeholder="Search channels, DMs, friends" />
                </InputGroup>
              </div>

              {isFriendsView ? (
                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-4 p-3">
                    <Card size="sm" className="bg-background/75">
                      <CardHeader className="border-b">
                        <CardTitle>Friends hub</CardTitle>
                        <CardDescription>
                          Direct messages, requests, and trusted connections.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2 pt-3">
                        <Button onClick={() => setIsAddFriendOpen(true)}>
                          <UserPlusIcon data-icon="inline-start" />
                          Add friend
                        </Button>
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-between px-1">
                      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Direct messages
                      </div>
                      <Badge variant="secondary">
                        {conversations?.length ?? 0}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1">
                      {conversations?.map((conversation) => (
                        <Button
                          key={conversation._id}
                          className={cn(
                            "h-auto justify-start rounded-xl px-2 py-2",
                            activeConversationId === conversation._id &&
                              "bg-accent"
                          )}
                          variant="ghost"
                          onClick={() => navigate(getDmPath(conversation._id))}
                        >
                          <div className="flex w-full items-center gap-3">
                            <Avatar size="sm">
                              <AvatarImage
                                src={
                                  conversation.otherUser?.avatarUrl ?? undefined
                                }
                              />
                              <AvatarFallback>
                                {getInitials(
                                  getDisplayName(conversation.otherUser)
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 text-left">
                              <div className="truncate font-medium">
                                {getDisplayName(conversation.otherUser)}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {conversation.latestMessage?.body ??
                                  "Start chatting"}
                              </div>
                            </div>
                            {conversation.activeCall ? (
                              <Badge variant="secondary">Call</Badge>
                            ) : null}
                          </div>
                        </Button>
                      ))}

                      {!conversations?.length ? (
                        <Empty className="mt-2 border-border/60 bg-background/60">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <MessageSquareIcon />
                            </EmptyMedia>
                            <EmptyTitle>No DMs yet</EmptyTitle>
                            <EmptyDescription>
                              Add a friend to open your first private
                              conversation.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : null}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-4 p-3">
                    <Card size="sm" className="bg-background/70">
                      <CardHeader className="border-b">
                        <CardTitle>{activeServer?.name ?? "Server"}</CardTitle>
                        <CardDescription>
                          {activeServer?.description ||
                            "Flat channels, invite-only access, and reactive voice presence."}
                        </CardDescription>
                        <CardAction>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button size="icon-sm" variant="ghost" />}
                            >
                              <Settings2Icon />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                Server actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={() => setIsInviteOpen(true)}
                                >
                                  <CopyIcon />
                                  Create invite
                                </DropdownMenuItem>
                                {permissions.manageChannels ||
                                permissions.admin ? (
                                  <DropdownMenuItem
                                    onClick={() => setIsCreateChannelOpen(true)}
                                  >
                                    <PlusIcon />
                                    New channel
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardAction>
                      </CardHeader>
                    </Card>

                    <ChannelSection
                      activeChannelId={routeChannelId}
                      channels={textChannels}
                      icon={HashIcon}
                      label="Text channels"
                      onSelect={(channelId) =>
                        activeServerId
                          ? navigate(getChannelPath(activeServerId, channelId))
                          : undefined
                      }
                    />

                    <ChannelSection
                      activeChannelId={routeChannelId}
                      channels={voiceChannels}
                      counts={voicePresence}
                      icon={Volume2Icon}
                      label="Voice channels"
                      onSelect={(channelId) =>
                        activeServerId
                          ? navigate(getChannelPath(activeServerId, channelId))
                          : undefined
                      }
                    />
                  </div>
                </ScrollArea>
              )}
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="58%" minSize="40%">
            <main className="flex h-full min-w-0 flex-col bg-background">
              <header className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3">
                <div className="flex min-w-0 items-start gap-2">
                  <Tooltip>
                    <TooltipTrigger
                      render={<Button size="icon-sm" variant="ghost" />}
                      onClick={toggleLeftSidebar}
                    >
                      <PanelLeftIcon />
                    </TooltipTrigger>
                    <TooltipContent>
                      {isLeftSidebarCollapsed
                        ? "Show left sidebar (Cmd/Ctrl+B)"
                        : "Hide left sidebar (Cmd/Ctrl+B)"}
                    </TooltipContent>
                  </Tooltip>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold">
                      {headerTitle}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {headerSubtitle}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isFriendsView && activeConversation ? (
                    <Button
                      onClick={() => void startConversationCall()}
                      variant="outline"
                    >
                      <AudioLinesIcon data-icon="inline-start" />
                      Start call
                    </Button>
                  ) : null}
                  {isServerView && canCreateInvites(workspace) ? (
                    <Button
                      onClick={() => setIsInviteOpen(true)}
                      variant="outline"
                    >
                      <CopyIcon data-icon="inline-start" />
                      Invite
                    </Button>
                  ) : null}
                  <Tooltip>
                    <TooltipTrigger
                      render={<Button size="icon-sm" variant="ghost" />}
                      onClick={toggleRightSidebar}
                    >
                      <PanelRightIcon />
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRightSidebarCollapsed
                        ? "Show right sidebar (Cmd/Ctrl+Shift+B)"
                        : "Hide right sidebar (Cmd/Ctrl+Shift+B)"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </header>

              <div className="min-h-0 flex-1">
                {isFriendsView ? (
                  activeConversation ? (
                    <div className="flex h-full flex-col">
                      <ScrollArea className="min-h-0 flex-1">
                        <MessageFeed
                          emptyDescription={`Start the conversation with ${getDisplayName(
                            activeConversation.otherUser
                          )}.`}
                          emptyTitle="Say hello"
                          messages={messages}
                        />
                      </ScrollArea>
                      <div className="border-t border-border/60 p-4">
                        <MessageComposer
                          draft={messageDraft}
                          onChange={setMessageDraft}
                          onSend={() => void sendActiveMessage()}
                          placeholder={`Message ${getDisplayName(activeConversation.otherUser)}`}
                        />
                      </div>
                    </div>
                  ) : activeConversationId ? (
                    <ThreadLoadingState />
                  ) : (
                    <FriendsHome
                      friends={friends}
                      onAcceptRequest={(requestId) =>
                        void respondToRequest({ accept: true, requestId }).then(
                          () => toast.success("Friend request accepted."),
                          (error) => toast.error(getErrorMessage(error))
                        )
                      }
                      onDeclineRequest={(requestId) =>
                        void respondToRequest({
                          accept: false,
                          requestId,
                        }).then(
                          () => toast.success("Friend request declined."),
                          (error) => toast.error(getErrorMessage(error))
                        )
                      }
                      onMessageFriend={(friendId) =>
                        void openConversation(friendId)
                      }
                      onOpenAddFriend={() => setIsAddFriendOpen(true)}
                      onRemoveFriend={(friendId) =>
                        void removeFriend({ friendId }).then(
                          () => toast.success("Friend removed."),
                          (error) => toast.error(getErrorMessage(error))
                        )
                      }
                      onTabChange={setFriendsTab}
                      selectedTab={friendsTab}
                    />
                  )
                ) : !activeChannel ? (
                  <ThreadLoadingState />
                ) : activeChannel.kind === "voice" ? (
                  <VoiceChannelPanel
                    activeCall={activeCall}
                    channel={activeChannel}
                    members={activeVoiceMembers}
                    onJoin={() => void joinVoiceChannel(activeChannel)}
                  />
                ) : (
                  <div className="flex h-full flex-col">
                    <ScrollArea className="min-h-0 flex-1">
                      <MessageFeed
                        emptyDescription={`Be the first to post in #${activeChannel?.name ?? "general"}.`}
                        emptyTitle="No messages yet"
                        messages={messages}
                      />
                    </ScrollArea>
                    <div className="border-t border-border/60 p-4">
                      <MessageComposer
                        draft={messageDraft}
                        onChange={setMessageDraft}
                        onSend={() => void sendActiveMessage()}
                        placeholder={`Message #${activeChannel?.name ?? "general"}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <CallTray
                activeCall={activeCall}
                isConnecting={isCallConnecting}
                onDeafen={() => void toggleDeafen()}
                onLeave={() => void leaveActiveCall()}
                onMute={() => void toggleMute()}
                onShareScreen={triggerShareScreen}
              />
            </main>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            collapsible
            collapsedSize="0%"
            defaultSize="24%"
            maxSize="30%"
            minSize="14%"
            panelRef={rightSidebarRef}
            onResize={(size) =>
              setIsRightSidebarCollapsed(size.asPercentage === 0)
            }
          >
            <aside className="flex h-full flex-col border-l border-border/60 bg-card/40">
              <div className="border-b border-border/60 px-4 py-3">
                <div className="text-sm font-medium">
                  {isFriendsView ? "Profile" : "Members"}
                </div>
                <div className="text-xs text-muted-foreground">
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
                    canModerate={permissions.moveMembers || permissions.admin}
                    currentUserId={current?.user?._id ?? null}
                    voiceChannels={voiceChannels}
                    voicePresence={voicePresence ?? []}
                    workspace={workspace}
                    onForceDeafen={(memberUserId, forcedDeafen) =>
                      activeServerId
                        ? void setMemberDeafen({
                            forcedDeafen,
                            memberUserId,
                            serverId: activeServerId,
                          }).then(
                            () =>
                              toast.success(
                                forcedDeafen
                                  ? "Member deafened."
                                  : "Member undeafened."
                              ),
                            (error) => toast.error(getErrorMessage(error))
                          )
                        : undefined
                    }
                    onForceMute={(memberUserId, forcedMute) =>
                      activeServerId
                        ? void setMemberMute({
                            forcedMute,
                            memberUserId,
                            serverId: activeServerId,
                          }).then(
                            () =>
                              toast.success(
                                forcedMute ? "Member muted." : "Member unmuted."
                              ),
                            (error) => toast.error(getErrorMessage(error))
                          )
                        : undefined
                    }
                    onMoveMember={(memberUserId, targetChannelId) =>
                      activeServerId
                        ? void moveMember({
                            memberUserId,
                            serverId: activeServerId,
                            targetChannelId,
                          }).then(
                            () => toast.success("Move request sent."),
                            (error) => toast.error(getErrorMessage(error))
                          )
                        : undefined
                    }
                  />
                )}
              </ScrollArea>
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

function OnboardingDialog({
  current,
  displayNameDraft,
  handleDraft,
  handleError,
  onDisplayNameChange,
  onHandleChange,
  onSubmit,
}: {
  current: ReturnType<typeof useQuery<typeof api.users.current>>
  displayNameDraft: string
  handleDraft: string
  handleError: string | null
  onDisplayNameChange: (value: string) => void
  onHandleChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!current?.needsOnboarding) {
    return null
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finish your OpenCord profile</DialogTitle>
          <DialogDescription>
            Pick a permanent handle and the display name your friends will see.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="display-name">Display name</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="display-name"
                    placeholder="Party leader"
                    value={displayNameDraft}
                    onChange={(event) =>
                      onDisplayNameChange(event.target.value)
                    }
                  />
                </InputGroup>
                <FieldDescription>
                  You can change this later without affecting your handle.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(handleError)}>
              <FieldLabel htmlFor="handle">Handle</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>@</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-invalid={Boolean(handleError)}
                    id="handle"
                    placeholder="opencord-user"
                    value={handleDraft}
                    onChange={(event) => onHandleChange(event.target.value)}
                  />
                </InputGroup>
                <FieldDescription>
                  Handles are unique and immutable after setup.
                </FieldDescription>
                <FieldError>{handleError}</FieldError>
              </FieldContent>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">Save profile</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateServerDialog({
  description,
  name,
  onDescriptionChange,
  onNameChange,
  onOpenChange,
  onSubmit,
  open,
}: {
  description: string
  name: string
  onDescriptionChange: (value: string) => void
  onNameChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new server</DialogTitle>
          <DialogDescription>
            Start with a flat `#general` text channel and a `lounge` voice room.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="server-name">Server name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="server-name"
                  placeholder="Weekend raid squad"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="server-description">Description</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="server-description"
                  placeholder="Tight-knit group for late-night raids and weekend co-op."
                  rows={4}
                  value={description}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">Create server</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddFriendDialog({
  handle,
  onHandleChange,
  onOpenChange,
  onSubmit,
  open,
}: {
  handle: string
  onHandleChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a friend</DialogTitle>
          <DialogDescription>
            Search by immutable handle and open a DM once the request is
            accepted.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="friend-handle">Friend handle</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>@</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="friend-handle"
                  placeholder="teammate"
                  value={handle}
                  onChange={(event) => onHandleChange(event.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">Send request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function InviteDialog({
  activeServer,
  friends,
  landingChannelName,
  invites,
  onCopyInviteLink,
  onOpenChange,
  open,
}: {
  activeServer: Doc<"servers"> | null
  friends: FriendLite[]
  landingChannelName: string
  invites: Doc<"invites">[]
  onCopyInviteLink: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [friendSearch, setFriendSearch] = useState("")
  const filteredFriends = friends.filter((friend) => {
    const needle = friendSearch.trim().toLowerCase()
    if (!needle) {
      return true
    }

    return (
      getDisplayName(friend).toLowerCase().includes(needle) ||
      (friend.handle ?? "").toLowerCase().includes(needle)
    )
  })
  const latestInvite = invites[invites.length - 1] ?? null
  const inviteLink = latestInvite
    ? buildInviteLink(latestInvite.code)
    : "Generate a 7-day invite link"

  if (!activeServer) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-border/60 p-0">
        <DialogHeader className="gap-1 border-b border-border/60 px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Invite friends to {activeServer.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Recipients will land in #{landingChannelName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search friends"
              value={friendSearch}
              onChange={(event) => setFriendSearch(event.target.value)}
            />
          </InputGroup>

          <ScrollArea className="max-h-80 pr-2">
            <div className="flex flex-col gap-2">
              {filteredFriends.length ? (
                filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-3"
                  >
                    <Avatar>
                      <AvatarImage src={friend.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {getInitials(getDisplayName(friend))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {getDisplayName(friend)}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        @{friend.handle ?? "friend"}
                      </div>
                    </div>
                    <Button onClick={onCopyInviteLink} variant="secondary">
                      Invite
                    </Button>
                  </div>
                ))
              ) : (
                <Empty className="border-border/60 bg-muted/20 py-12">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <UsersIcon />
                    </EmptyMedia>
                    <EmptyTitle>No matching friends</EmptyTitle>
                    <EmptyDescription>
                      Try another name, or copy the invite link below.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col items-stretch gap-2 border-t border-border/60 bg-muted/10 px-6 py-4">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Invite link
          </div>
          <InputGroup>
            <InputGroupInput className="truncate" readOnly value={inviteLink} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="secondary" onClick={onCopyInviteLink}>
                Copy
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateChannelDialog({
  access,
  kind,
  name,
  onAccessChange,
  onKindChange,
  onNameChange,
  onOpenChange,
  onSubmit,
  open,
}: {
  access: ChannelAccess
  kind: ChannelKind
  name: string
  onAccessChange: (value: ChannelAccess) => void
  onKindChange: (value: ChannelKind) => void
  onNameChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription>
            Keep the MVP flat: choose a channel type and access mode.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Channel type</FieldLabel>
              <ToggleGroup
                className="w-full"
                multiple={false}
                value={[kind]}
                onValueChange={(value) =>
                  value[0] ? onKindChange(value[0] as ChannelKind) : undefined
                }
              >
                <ToggleGroupItem className="flex-1" value="text">
                  <HashIcon />
                  Text
                </ToggleGroupItem>
                <ToggleGroupItem className="flex-1" value="voice">
                  <Volume2Icon />
                  Voice
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Access</FieldLabel>
              <ToggleGroup
                className="w-full"
                multiple={false}
                value={[access]}
                onValueChange={(value) =>
                  value[0]
                    ? onAccessChange(value[0] as ChannelAccess)
                    : undefined
                }
              >
                <ToggleGroupItem className="flex-1" value="public">
                  Public
                </ToggleGroupItem>
                <ToggleGroupItem className="flex-1" value="private">
                  Private
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="channel-name">Channel name</FieldLabel>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  {kind === "text" ? (
                    <InputGroupText>#</InputGroupText>
                  ) : (
                    <Volume2Icon />
                  )}
                </InputGroupAddon>
                <InputGroupInput
                  id="channel-name"
                  placeholder={kind === "text" ? "strategy-room" : "squad-chat"}
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">Create channel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ChannelSection({
  activeChannelId,
  channels,
  counts,
  icon: Icon,
  label,
  onSelect,
}: {
  activeChannelId: Id<"channels"> | null
  channels: Doc<"channels">[]
  counts?: VoicePresenceItem[]
  icon: typeof HashIcon
  label: string
  onSelect: (channelId: Id<"channels">) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      {channels.length ? (
        channels.map((channel) => {
          const count =
            counts?.filter((entry) => entry.channelId === channel._id).length ??
            0

          return (
            <Button
              key={channel._id}
              className={cn(
                "h-auto justify-start rounded-xl px-2 py-2",
                activeChannelId === channel._id && "bg-accent"
              )}
              variant="ghost"
              onClick={() => onSelect(channel._id)}
            >
              <div className="flex w-full items-center gap-2">
                <Icon />
                <span className="flex-1 truncate text-left">
                  {channel.name}
                </span>
                {typeof counts !== "undefined" ? (
                  <Badge variant="secondary">{count}</Badge>
                ) : channel.access === "private" ? (
                  <Badge variant="outline">Private</Badge>
                ) : null}
              </div>
            </Button>
          )
        })
      ) : (
        <Empty className="border-border/60 bg-background/50 p-4">
          <EmptyHeader>
            <EmptyTitle>No channels</EmptyTitle>
            <EmptyDescription>
              Create one to start the server loop.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function FriendsHome({
  friends,
  onAcceptRequest,
  onDeclineRequest,
  onMessageFriend,
  onOpenAddFriend,
  onRemoveFriend,
  onTabChange,
  selectedTab,
}: {
  friends: FriendsResult | undefined
  onAcceptRequest: (requestId: Id<"friendRequests">) => void
  onDeclineRequest: (requestId: Id<"friendRequests">) => void
  onMessageFriend: (friendId: Id<"users">) => void
  onOpenAddFriend: () => void
  onRemoveFriend: (friendId: Id<"users">) => void
  onTabChange: (value: string) => void
  selectedTab: string
}) {
  return (
    <Tabs
      className="flex h-full flex-col"
      value={selectedTab}
      onValueChange={onTabChange}
    >
      <div className="border-b border-border/60 px-4 py-3">
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="add">Add friend</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent className="min-h-0 flex-1 p-4" value="all">
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle>Friends</CardTitle>
            <CardDescription>
              People you can message instantly and call 1:1.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 py-4">
            {friends?.friends.length ? (
              friends.friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <Avatar>
                    <AvatarImage src={friend.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {getInitials(getDisplayName(friend))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {getDisplayName(friend)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      @{friend.handle ?? "unknown"}
                    </div>
                  </div>
                  <Button
                    onClick={() => onMessageFriend(friend._id)}
                    variant="secondary"
                  >
                    Message
                  </Button>
                  <Button
                    onClick={() => onRemoveFriend(friend._id)}
                    variant="outline"
                  >
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <Empty className="flex-1 border-border/60 bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>No friends yet</EmptyTitle>
                  <EmptyDescription>
                    Add your crew to unlock DMs and private calls.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={onOpenAddFriend}>
                    <UserPlusIcon data-icon="inline-start" />
                    Add your first friend
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent className="min-h-0 flex-1 p-4" value="pending">
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle>Pending requests</CardTitle>
            <CardDescription>
              Incoming and outgoing requests update live.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 py-4">
            <section className="flex flex-col gap-3">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Incoming
              </div>
              {friends?.incoming.length ? (
                friends.incoming.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                  >
                    <Avatar>
                      <AvatarImage
                        src={request.fromUser?.avatarUrl ?? undefined}
                      />
                      <AvatarFallback>
                        {getInitials(getDisplayName(request.fromUser))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {getDisplayName(request.fromUser)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{request.fromUser?.handle ?? "unknown"}
                      </div>
                    </div>
                    <Button onClick={() => onAcceptRequest(request._id)}>
                      <CheckIcon data-icon="inline-start" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => onDeclineRequest(request._id)}
                      variant="outline"
                    >
                      <XIcon data-icon="inline-start" />
                      Decline
                    </Button>
                  </div>
                ))
              ) : (
                <Empty className="border-border/60 bg-muted/20">
                  <EmptyHeader>
                    <EmptyTitle>No incoming requests</EmptyTitle>
                    <EmptyDescription>
                      You are caught up for now.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Outgoing
              </div>
              {friends?.outgoing.length ? (
                friends.outgoing.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                  >
                    <Avatar>
                      <AvatarImage
                        src={request.toUser?.avatarUrl ?? undefined}
                      />
                      <AvatarFallback>
                        {getInitials(getDisplayName(request.toUser))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {getDisplayName(request.toUser)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{request.toUser?.handle ?? "unknown"}
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))
              ) : (
                <Empty className="border-border/60 bg-muted/20">
                  <EmptyHeader>
                    <EmptyTitle>No outgoing requests</EmptyTitle>
                    <EmptyDescription>
                      Invite more people into your private network.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent className="min-h-0 flex-1 p-4" value="add">
        <Card className="h-full">
          <CardHeader className="border-b">
            <CardTitle>Grow your circle</CardTitle>
            <CardDescription>
              Add trusted friends and start private conversations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 py-4">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle>Add a friend</CardTitle>
                <CardDescription>
                  Search by handle and open a private DM after acceptance.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={onOpenAddFriend}>
                  <UserPlusIcon data-icon="inline-start" />
                  Open friend dialog
                </Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function MessageFeed({
  emptyDescription,
  emptyTitle,
  messages,
}: {
  emptyDescription: string
  emptyTitle: string
  messages: MessageListItem[] | undefined
}) {
  if (!messages) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Empty className="max-w-xl border-border/60 bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((message) => (
        <div
          key={message._id}
          className="flex gap-3 rounded-2xl border border-transparent px-1 py-2 hover:border-border/50 hover:bg-muted/20"
        >
          <Avatar>
            <AvatarImage src={message.author?.avatarUrl ?? undefined} />
            <AvatarFallback>
              {getInitials(getDisplayName(message.author))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {getDisplayName(message.author)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.createdAt)}
              </span>
            </div>
            <p className="text-sm leading-6 whitespace-pre-wrap text-foreground/95">
              {message.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function MessageComposer({
  draft,
  onChange,
  onSend,
  placeholder,
}: {
  draft: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
}) {
  return (
    <InputGroup className="min-h-14 items-end">
      <InputGroupTextarea
        maxLength={4000}
        placeholder={placeholder}
        rows={2}
        value={draft}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            onSend()
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          disabled={!draft.trim()}
          size="icon-sm"
          onClick={onSend}
        >
          <ChevronRightIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

function VoiceChannelPanel({
  activeCall,
  channel,
  members,
  onJoin,
}: {
  activeCall: ActiveCall | null
  channel: Doc<"channels">
  members: VoicePresenceItem[]
  onJoin: () => void
}) {
  const joined =
    activeCall?.kind === "voice" && activeCall.channelId === channel._id

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-3xl bg-card/95">
        <CardHeader>
          <Badge className="w-fit" variant="secondary">
            Voice room
          </Badge>
          <CardTitle>{channel.name}</CardTitle>
          <CardDescription>
            One active screen share per room, live member presence, and a
            persistent call tray in the main shell.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onJoin} variant={joined ? "secondary" : "default"}>
              <Volume2Icon data-icon="inline-start" />
              {joined ? "Rejoin session" : "Join voice"}
            </Button>
            <Badge variant="outline">{members.length} connected</Badge>
          </div>

          {members.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {members.map((member) => (
                <Card key={member._id} className="bg-muted/20">
                  <CardContent className="flex items-center gap-3 pt-4">
                    <Avatar>
                      <AvatarImage src={member.user?.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {getInitials(getDisplayName(member.user))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {getDisplayName(member.user)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        Active in voice
                      </div>
                    </div>
                    <Badge variant="secondary">Live</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty className="border-border/60 bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Volume2Icon />
                </EmptyMedia>
                <EmptyTitle>Nobody is in the room</EmptyTitle>
                <EmptyDescription>
                  Join first and invite your squad in.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DmProfilePanel({
  conversation,
}: {
  conversation: ConversationListItem | null
}) {
  if (!conversation?.otherUser) {
    return (
      <div className="p-4">
        <Empty className="border-border/60 bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No profile selected</EmptyTitle>
            <EmptyDescription>
              Pick a DM to see profile details and quick actions.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar size="lg">
            <AvatarImage src={conversation.otherUser.avatarUrl ?? undefined} />
            <AvatarFallback>
              {getInitials(getDisplayName(conversation.otherUser))}
            </AvatarFallback>
          </Avatar>
          <CardTitle>{getDisplayName(conversation.otherUser)}</CardTitle>
          <CardDescription>@{conversation.otherUser.handle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
            Latest activity:{" "}
            {conversation.latestMessage?.body ?? "No messages exchanged yet."}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MembersPanel({
  canModerate,
  currentUserId,
  onForceDeafen,
  onForceMute,
  onMoveMember,
  voiceChannels,
  voicePresence,
  workspace,
}: {
  canModerate: boolean
  currentUserId: Id<"users"> | null
  onForceDeafen: (memberUserId: Id<"users">, forcedDeafen: boolean) => void
  onForceMute: (memberUserId: Id<"users">, forcedMute: boolean) => void
  onMoveMember: (
    memberUserId: Id<"users">,
    targetChannelId: Id<"channels">
  ) => void
  voiceChannels: Doc<"channels">[]
  voicePresence: VoicePresenceItem[]
  workspace: WorkspaceResult | undefined
}) {
  if (!workspace) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {workspace.members.map((member) => {
        const voiceState =
          voicePresence.find((state) => state.userId === member.userId) ?? null
        const voiceChannel = voiceState
          ? (voiceChannels.find(
              (channel) => channel._id === voiceState.channelId
            ) ?? null)
          : null

        return (
          <Card key={member._id} size="sm" className="bg-muted/20">
            <CardContent className="flex items-center gap-3 pt-3">
              <Avatar>
                <AvatarImage src={member.user?.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {getInitials(getDisplayName(member.user))}
                </AvatarFallback>
                {voiceState ? <AvatarBadge /> : null}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {member.nickname || getDisplayName(member.user)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {voiceChannel
                    ? `In ${voiceChannel.name}`
                    : member.userId === currentUserId
                      ? "You"
                      : "Available"}
                </div>
              </div>
              {voiceState ? (
                <Badge variant="secondary">Voice</Badge>
              ) : (
                <Badge variant="outline">Text</Badge>
              )}

              {canModerate && voiceState ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button size="icon-sm" variant="ghost" />}
                  >
                    <Settings2Icon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() =>
                          onForceMute(member.userId, !voiceState.forcedMute)
                        }
                      >
                        {voiceState.forcedMute ? <MicIcon /> : <MicOffIcon />}
                        {voiceState.forcedMute
                          ? "Unmute member"
                          : "Mute member"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onForceDeafen(member.userId, !voiceState.forcedDeafen)
                        }
                      >
                        {voiceState.forcedDeafen ? (
                          <Volume2Icon />
                        ) : (
                          <VolumeXIcon />
                        )}
                        {voiceState.forcedDeafen
                          ? "Undeafen member"
                          : "Deafen member"}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Move to channel</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {voiceChannels.map((channel) => (
                        <DropdownMenuItem
                          key={channel._id}
                          onClick={() =>
                            onMoveMember(member.userId, channel._id)
                          }
                        >
                          <Volume2Icon />
                          {channel.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CallTray({
  activeCall,
  isConnecting,
  onDeafen,
  onLeave,
  onMute,
  onShareScreen,
}: {
  activeCall: ActiveCall | null
  isConnecting: boolean
  onDeafen: () => void
  onLeave: () => void
  onMute: () => void
  onShareScreen: () => void
}) {
  if (!activeCall) {
    return (
      <div className="border-t border-border/60 px-4 py-3">
        <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <AudioLinesIcon />
            No active call. Join a voice room or start a DM session.
          </div>
          <Badge variant="outline">Idle</Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-border/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/8 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{activeCall.label}</div>
          <div className="truncate text-xs text-muted-foreground">
            Room {activeCall.roomKey} • Session{" "}
            {activeCall.sessionId?.slice(0, 8) ?? "connecting"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant={activeCall.muted ? "secondary" : "outline"}
            onClick={onMute}
          >
            {activeCall.muted ? <MicOffIcon /> : <MicIcon />}
          </Button>
          <Button
            size="icon-sm"
            variant={activeCall.deafened ? "secondary" : "outline"}
            onClick={onDeafen}
          >
            {activeCall.deafened ? <VolumeXIcon /> : <Volume2Icon />}
          </Button>
          <Button
            disabled
            size="icon-sm"
            variant="outline"
            onClick={onShareScreen}
          >
            <MonitorUpIcon />
          </Button>
          <Button variant="destructive" onClick={onLeave}>
            {isConnecting ? "Cancel" : "Leave call"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function InvitePlaceholderScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-xl border-border/70 bg-card/90 shadow-2xl">
        <CardHeader>
          <Badge variant="secondary">Invite links coming next</Badge>
          <CardTitle>
            Invite redemption is not wired into the router yet
          </CardTitle>
          <CardDescription>
            This route stays reserved so invite links keep their own URL while
            the channels shell moves onto React Router.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <BellIcon />
            <AlertTitle>Use the channels shell for now</AlertTitle>
            <AlertDescription>
              Open the main app at `/channels` until the invite join flow is
              hooked up.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

function ThreadLoadingState() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="min-h-0 flex-1 rounded-3xl" />
    </div>
  )
}

function getDmPath(conversationId: Id<"conversations">) {
  return `${CHANNELS_PATH}/dm/${conversationId}`
}

function getServerPath(serverId: Id<"servers">) {
  return `${CHANNELS_PATH}/${serverId}`
}

function getChannelPath(serverId: Id<"servers">, channelId: Id<"channels">) {
  return `${CHANNELS_PATH}/${serverId}/${channelId}`
}

function getLastChannelStorageKey(serverId: Id<"servers">) {
  return `${LAST_CHANNEL_STORAGE_KEY_PREFIX}${serverId}`
}

function getLastVisitedChannel(serverId: Id<"servers">) {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(
    getLastChannelStorageKey(serverId)
  ) as Id<"channels"> | null
}

function setLastVisitedChannel(
  serverId: Id<"servers">,
  channelId: Id<"channels">
) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(getLastChannelStorageKey(serverId), channelId)
}

function resolveServerLandingChannel(
  serverId: Id<"servers">,
  channels: Doc<"channels">[]
) {
  const lastVisitedChannelId = getLastVisitedChannel(serverId)
  const lastVisitedChannel = lastVisitedChannelId
    ? (channels.find((channel) => channel._id === lastVisitedChannelId) ?? null)
    : null

  if (lastVisitedChannel) {
    return lastVisitedChannel
  }

  return (
    channels.find((channel) => channel.kind === "text") ?? channels[0] ?? null
  )
}

function getDisplayName(
  user:
    | Doc<"users">
    | FriendLite
    | {
        displayName?: string | null
        name?: string | null
      }
    | null
    | undefined
) {
  if (!user) {
    return "OpenCord User"
  }

  if ("displayName" in user && user.displayName) {
    return user.displayName
  }

  if ("name" in user && user.name) {
    return user.name
  }

  return "OpenCord User"
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong."
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(value)
}

function buildInviteLink(code: string) {
  if (typeof window === "undefined") {
    return `https://opencord.app/invite/${code}`
  }

  return new URL(`/invite/${code}`, window.location.origin).toString()
}

function resolvePermissions(workspace: WorkspaceResult) {
  if (workspace.membership.isOwner) {
    return {
      admin: true,
      createInvites: true,
      deafenMembers: true,
      manageChannels: true,
      manageRoles: true,
      moveMembers: true,
      muteMembers: true,
    } satisfies PermissionSet
  }

  const assignedRoles = workspace.roles.filter((role) =>
    workspace.membership.roleIds.includes(role._id)
  )

  return mergePermissionSets(assignedRoles)
}

function canCreateInvites(workspace: WorkspaceResult | undefined) {
  if (!workspace) {
    return false
  }

  const permissions = resolvePermissions(workspace)
  return permissions.admin || permissions.createInvites
}
