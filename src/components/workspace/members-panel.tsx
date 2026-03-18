import {
  MicIcon,
  MicOffIcon,
  Settings2Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayName, getInitials } from "@/lib/presentation";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { VoicePresenceItem, WorkspaceResult } from "./workspace-types";

const MEMBER_SKELETON_KEYS = [
  "member-skeleton-1",
  "member-skeleton-2",
  "member-skeleton-3",
  "member-skeleton-4",
  "member-skeleton-5",
  "member-skeleton-6",
] as const;

interface MembersPanelProps {
  canModerate: boolean;
  onForceDeafen: (memberUserId: Id<"users">, forcedDeafen: boolean) => void;
  onForceMute: (memberUserId: Id<"users">, forcedMute: boolean) => void;
  onMoveMember: (
    memberUserId: Id<"users">,
    targetChannelId: Id<"channels">
  ) => void;
  voiceChannels: Doc<"channels">[];
  voicePresence: VoicePresenceItem[];
  workspace: WorkspaceResult | undefined;
}

interface MemberCardProps {
  canModerate: boolean;
  member: WorkspaceResult["members"][number];
  onForceDeafen: (memberUserId: Id<"users">, forcedDeafen: boolean) => void;
  onForceMute: (memberUserId: Id<"users">, forcedMute: boolean) => void;
  onMoveMember: (
    memberUserId: Id<"users">,
    targetChannelId: Id<"channels">
  ) => void;
  voiceChannels: Doc<"channels">[];
  voicePresence: VoicePresenceItem[];
}

export function MembersPanel({
  canModerate,
  onForceDeafen,
  onForceMute,
  onMoveMember,
  voiceChannels,
  voicePresence,
  workspace,
}: MembersPanelProps) {
  if (!workspace) {
    return (
      <div className="flex flex-col gap-2 px-4 py-2">
        {MEMBER_SKELETON_KEYS.map((key) => (
          <Skeleton className="h-14 rounded-xl" key={key} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-1">
      {workspace.members.map((member) => (
        <MemberCard
          canModerate={canModerate}
          key={member._id}
          member={member}
          onForceDeafen={onForceDeafen}
          onForceMute={onForceMute}
          onMoveMember={onMoveMember}
          voiceChannels={voiceChannels}
          voicePresence={voicePresence}
        />
      ))}
    </div>
  );
}

function MemberCard({
  canModerate,
  member,
  onForceDeafen,
  onForceMute,
  onMoveMember,
  voiceChannels,
  voicePresence,
}: MemberCardProps) {
  const voiceState =
    voicePresence.find((state) => state.userId === member.userId) ?? null;
  const voiceChannel = voiceState
    ? (voiceChannels.find((channel) => channel._id === voiceState.channelId) ??
      null)
    : null;
  const presenceLabel = voiceChannel ? `In ${voiceChannel.name}` : null;

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/50">
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
        {presenceLabel ? (
          <div className="truncate text-muted-foreground text-xs">
            {presenceLabel}
          </div>
        ) : null}
      </div>

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
                {voiceState.forcedMute ? "Unmute member" : "Mute member"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onForceDeafen(member.userId, !voiceState.forcedDeafen)
                }
              >
                {voiceState.forcedDeafen ? <Volume2Icon /> : <VolumeXIcon />}
                {voiceState.forcedDeafen ? "Undeafen member" : "Deafen member"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Move to channel</DropdownMenuLabel>
            <DropdownMenuGroup>
              {voiceChannels.map((channel) => (
                <DropdownMenuItem
                  key={channel._id}
                  onClick={() => onMoveMember(member.userId, channel._id)}
                >
                  <Volume2Icon />
                  {channel.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
