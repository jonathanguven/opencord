import { Volume2Icon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDisplayName, getInitials } from "@/lib/presentation";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ActiveCall, VoicePresenceItem } from "./workspace-types";

interface VoiceChannelPanelProps {
  activeCall: ActiveCall | null;
  channel: Doc<"channels">;
  members: VoicePresenceItem[];
  onJoin: () => void;
}

export function VoiceChannelPanel({
  activeCall,
  channel,
  members,
  onJoin,
}: VoiceChannelPanelProps) {
  const joined =
    activeCall?.kind === "voice" && activeCall.channelId === channel._id;

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
                <Card className="bg-muted/20" key={member._id}>
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
                      <div className="truncate text-muted-foreground text-xs">
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
  );
}
