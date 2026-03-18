import { UsersIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { ConversationListItem } from "@/components/workspace/workspace-types";
import { getDisplayName, getInitials } from "@/lib/presentation";

interface DmProfilePanelProps {
  conversation: ConversationListItem | null;
}

export function DmProfilePanel({ conversation }: DmProfilePanelProps) {
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
    );
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
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-muted-foreground text-sm">
            Latest activity:{" "}
            {conversation.latestMessage?.body ?? "No messages exchanged yet."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
