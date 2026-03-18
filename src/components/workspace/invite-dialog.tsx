import { SearchIcon, UsersIcon } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { ConversationListItem } from "./workspace-types";

const MAX_VISIBLE_RECIPIENTS = 50;

interface InviteDialogProps {
  activeServer: Doc<"servers"> | null;
  conversations: ConversationListItem[];
  inviteLink: string;
  landingChannelName: string;
  onCopyInviteLink: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function InviteDialog({
  activeServer,
  conversations,
  inviteLink,
  landingChannelName,
  onCopyInviteLink,
  onOpenChange,
  open,
}: InviteDialogProps) {
  const [friendSearch, setFriendSearch] = useState("");
  const filteredFriends = useMemo(() => {
    const needle = friendSearch.trim().toLowerCase();
    const seenUserIds = new Set<string>();
    const recipients: Doc<"users">[] = [];

    for (const conversation of conversations) {
      const user = conversation.otherUser;
      if (!user || seenUserIds.has(user._id)) {
        continue;
      }

      seenUserIds.add(user._id);

      const displayName = getDisplayName(user);
      const handle = user.handle ?? "";
      if (
        needle &&
        !displayName.toLowerCase().includes(needle) &&
        !handle.toLowerCase().includes(needle)
      ) {
        continue;
      }

      recipients.push(user);
      if (recipients.length >= MAX_VISIBLE_RECIPIENTS) {
        break;
      }
    }

    return recipients;
  }, [conversations, friendSearch]);

  if (!activeServer) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[500px] gap-0 overflow-hidden border border-white/8 bg-[#313338] p-0 text-[#f2f3f5] shadow-[0_22px_80px_rgba(0,0,0,0.48)]">
        <DialogHeader className="gap-1 border-white/8 border-b px-5 pt-6 pb-5">
          <DialogTitle className="font-semibold text-[1.1rem] leading-tight tracking-[-0.01em]">
            Invite friends to {activeServer.name}
          </DialogTitle>
          <DialogDescription className="pt-1 text-[#b5bac1] text-sm">
            Recipients will land in #{landingChannelName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 py-5">
          <InputGroup className="h-10 rounded-lg border-white/10 bg-[#1e1f22] transition-colors focus-within:border-white/20">
            <InputGroupAddon
              align="inline-start"
              className="pl-3 text-[#b5bac1]"
            >
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-10 px-0 text-[#dbdee1] text-[15px] placeholder:text-[#949ba4]"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFriendSearch(event.target.value)
              }
              placeholder="Search friends"
              value={friendSearch}
            />
          </InputGroup>

          <ScrollArea className="max-h-[456px]">
            <div className="flex flex-col gap-1.5">
              {filteredFriends.length ? (
                filteredFriends.map((friend) => (
                  <div
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/4"
                    key={friend._id}
                  >
                    <Avatar className="size-10 border border-white/8">
                      <AvatarImage src={friend.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-[#2b2d31] text-[#f2f3f5]">
                        {getInitials(getDisplayName(friend))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-[#f2f3f5] text-[15px] leading-5">
                        {getDisplayName(friend)}
                      </div>
                      <div className="truncate text-[#949ba4] text-sm leading-5">
                        {friend.handle ?? "friend"}
                      </div>
                    </div>
                    <Button
                      className="h-8 min-w-19 rounded-[10px] border border-white/6 bg-white/8 px-4 font-semibold text-[#f2f3f5] hover:bg-white/12"
                      onClick={onCopyInviteLink}
                    >
                      Invite
                    </Button>
                  </div>
                ))
              ) : (
                <Empty className="rounded-xl border border-white/8 bg-white/3 py-12">
                  <EmptyHeader>
                    <EmptyMedia
                      className="border-white/8 bg-white/5 text-[#f2f3f5]"
                      variant="icon"
                    >
                      <UsersIcon />
                    </EmptyMedia>
                    <EmptyTitle className="text-[#f2f3f5]">
                      No matching friends
                    </EmptyTitle>
                    <EmptyDescription className="text-[#949ba4]">
                      Try another name, or copy the invite link below.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="border-white/8 border-t bg-[#2b2d31] px-5 pt-4 pb-5">
          <InputGroup className="mt-0.5 h-10 w-full rounded-lg border-white/10 bg-[#1e1f22]">
            <InputGroupInput
              className="h-10 min-w-0 flex-1 px-3 text-[#dbdee1] text-[15px]"
              readOnly
              value={inviteLink}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                className="h-8 rounded-[8px] px-5 font-semibold"
                onClick={onCopyInviteLink}
                variant="invite"
              >
                Copy
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <div className="px-1 pt-2 text-[#949ba4] text-xs leading-relaxed">
            Your invite link expires in 7 days.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
