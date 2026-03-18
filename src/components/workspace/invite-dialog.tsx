import { SearchIcon, UsersIcon } from "lucide-react";
import { type ChangeEvent, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDisplayName, getInitials } from "@/lib/presentation";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { FriendLite } from "./workspace-types";

interface InviteDialogProps {
  activeServer: Doc<"servers"> | null;
  friends: FriendLite[];
  inviteLink: string;
  landingChannelName: string;
  onCopyInviteLink: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function InviteDialog({
  activeServer,
  friends,
  inviteLink,
  landingChannelName,
  onCopyInviteLink,
  onOpenChange,
  open,
}: InviteDialogProps) {
  const [friendSearch, setFriendSearch] = useState("");
  const filteredFriends = friends.filter((friend) => {
    const needle = friendSearch.trim().toLowerCase();
    if (!needle) {
      return true;
    }

    return (
      getDisplayName(friend).toLowerCase().includes(needle) ||
      (friend.handle ?? "").toLowerCase().includes(needle)
    );
  });

  if (!activeServer) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-border/60 p-0">
        <DialogHeader className="gap-1 border-border/60 border-b px-6 pt-6 pb-4">
          <DialogTitle className="font-semibold text-xl">
            Invite friends to {activeServer.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Recipients will land in #{landingChannelName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFriendSearch(event.target.value)
              }
              placeholder="Search friends"
              value={friendSearch}
            />
          </InputGroup>

          <ScrollArea className="max-h-80 pr-2">
            <div className="flex flex-col gap-2">
              {filteredFriends.length ? (
                filteredFriends.map((friend) => (
                  <div
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-3"
                    key={friend._id}
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
                      <div className="truncate text-muted-foreground text-sm">
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

        <DialogFooter className="flex-col items-stretch gap-2 border-border/60 border-t bg-muted/10 px-6 py-4">
          <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Invite link
          </div>
          <InputGroup>
            <InputGroupInput className="truncate" readOnly value={inviteLink} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={onCopyInviteLink} variant="secondary">
                Copy
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
