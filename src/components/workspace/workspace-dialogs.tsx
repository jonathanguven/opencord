import {
  ArrowRightIcon,
  CompassIcon,
  HashIcon,
  Volume2Icon,
  LockIcon,
} from "lucide-react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface OnboardingDialogProps {
  displayNameDraft: string;
  handleDraft: string;
  handleError: string | null;
  needsOnboarding?: boolean;
  onDisplayNameChange: (value: string) => void;
  onHandleChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function OnboardingDialog({
  displayNameDraft,
  handleDraft,
  handleError,
  needsOnboarding = false,
  onDisplayNameChange,
  onHandleChange,
  onSubmit,
}: OnboardingDialogProps) {
  if (!needsOnboarding) {
    return null;
  }

  return (
    <Dialog onOpenChange={() => undefined} open>
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
                    onChange={(event) =>
                      onDisplayNameChange(event.target.value)
                    }
                    placeholder="Party leader"
                    value={displayNameDraft}
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
                    autoCapitalize="none"
                    autoComplete="off"
                    id="handle"
                    maxLength={24}
                    onChange={(event) => onHandleChange(event.target.value)}
                    placeholder="opencord_user"
                    spellCheck={false}
                    value={handleDraft}
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
  );
}

interface CreateServerDialogProps {
  description: string;
  joinInviteCode: string;
  joinInviteError: string | null;
  mode: "create" | "join";
  name: string;
  onDescriptionChange: (value: string) => void;
  onJoinInviteChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmitCreate: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitJoin: (event: FormEvent<HTMLFormElement>) => void;
  onToggleMode: (mode: "create" | "join") => void;
  open: boolean;
}

export function CreateServerDialog({
  description,
  joinInviteCode,
  joinInviteError,
  mode,
  name,
  onDescriptionChange,
  onJoinInviteChange,
  onNameChange,
  onOpenChange,
  onSubmitCreate,
  onSubmitJoin,
  onToggleMode,
  open,
}: CreateServerDialogProps) {
  const inviteExamples = [
    "hTKzmak",
    "https://opencord.app/invite/hTKzmak",
    "/invite/hTKzmak",
  ] as const;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        {mode === "create" ? (
          <div className="flex flex-col">
            <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
              <DialogHeader className="gap-3">
                <DialogTitle className="text-center font-semibold text-3xl tracking-tight">
                  Create a new server
                </DialogTitle>
                <DialogDescription className="text-center text-base leading-relaxed">
                  Start with a flat `#general` text channel and a `lounge` voice
                  room for your crew.
                </DialogDescription>
              </DialogHeader>

              <form className="flex flex-col gap-5" onSubmit={onSubmitCreate}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="server-name">Server name</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="server-name"
                        onChange={(event) => onNameChange(event.target.value)}
                        placeholder="Weekend raid squad"
                        value={name}
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="server-description">
                      Description
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id="server-description"
                        onChange={(event) =>
                          onDescriptionChange(event.target.value)
                        }
                        placeholder="Tight-knit group for late-night raids and weekend co-op."
                        rows={4}
                        value={description}
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>

                <Card className="border-border/60 bg-muted/20 shadow-none">
                  <CardContent className="flex flex-col gap-3 px-5 py-5">
                    <div className="text-center font-semibold text-3xl tracking-tight">
                      Have an invite already?
                    </div>
                    <Button
                      className="h-16 rounded-2xl font-semibold text-2xl"
                      onClick={() => onToggleMode("join")}
                      type="button"
                      variant="secondary"
                    >
                      Join a Server
                    </Button>
                  </CardContent>
                </Card>

                <DialogFooter>
                  <Button type="submit">Create server</Button>
                </DialogFooter>
              </form>
            </div>
          </div>
        ) : (
          <form className="flex flex-col" onSubmit={onSubmitJoin}>
            <div className="flex flex-col gap-6 px-6 pt-6 pb-5">
              <DialogHeader className="gap-3">
                <DialogTitle className="text-center font-semibold text-3xl tracking-tight">
                  Join a Server
                </DialogTitle>
                <DialogDescription className="text-center text-base leading-relaxed">
                  Enter an invite below to join an existing server.
                </DialogDescription>
              </DialogHeader>

              <Field data-invalid={Boolean(joinInviteError)}>
                <FieldLabel htmlFor="join-server-invite">
                  Invite link <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent className="gap-3">
                  <InputGroup>
                    <InputGroupInput
                      aria-invalid={Boolean(joinInviteError)}
                      autoCapitalize="none"
                      autoComplete="off"
                      id="join-server-invite"
                      onChange={(event) => {
                        onJoinInviteChange(event.target.value);
                      }}
                      placeholder="https://opencord.app/invite/hTKzmak"
                      spellCheck={false}
                      value={joinInviteCode}
                    />
                  </InputGroup>
                  <FieldDescription>Invites should look like</FieldDescription>
                  <div className="flex flex-wrap gap-2">
                    {inviteExamples.map((example) => (
                      <Badge
                        className="rounded-xl px-3 py-1.5 font-medium text-sm"
                        key={example}
                        variant="outline"
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                  <FieldError>{joinInviteError}</FieldError>
                </FieldContent>
              </Field>

              <Card className="border-border/60 bg-muted/30 shadow-none">
                <CardContent className="flex items-center gap-4 px-4 py-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <CompassIcon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-2xl tracking-tight">
                      Don't have an invite?
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Server discovery is not available in OpenCord yet, so ask
                      a member to share an invite code with you.
                    </p>
                  </div>
                  <ArrowRightIcon className="text-muted-foreground" />
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="justify-between sm:justify-between">
              <Button
                onClick={() => onToggleMode("create")}
                type="button"
                variant="ghost"
              >
                Back
              </Button>
              <Button disabled={!joinInviteCode.trim()} type="submit">
                Join Server
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CreateChannelDialogProps {
  access: "public" | "private";
  categoryLabel: string;
  kind: "text" | "voice";
  name: string;
  onAccessChange: (value: "public" | "private") => void;
  onKindChange: (value: "text" | "voice") => void;
  onNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
}

export function CreateChannelDialog({
  access,
  categoryLabel,
  kind,
  name,
  onAccessChange,
  onKindChange,
  onNameChange,
  onOpenChange,
  onSubmit,
  open,
}: CreateChannelDialogProps) {
  const channelTypeOptions = [
    {
      icon: HashIcon,
      value: "text" as const,
    },
    {
      icon: Volume2Icon,
      value: "voice" as const,
    },
  ];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md gap-0 rounded-2xl border border-sidebar-border bg-[#2b2d31] p-0 text-[#f2f3f5] ring-0">
        <form className="flex flex-col" onSubmit={onSubmit}>
          <DialogHeader className="gap-1 px-5 pt-5 pb-4">
            <DialogTitle className="font-bold text-[#f2f3f5] text-[1.45rem]">
              Create Channel
            </DialogTitle>
            <DialogDescription className="text-[#b5bac1] text-sm">
              in {categoryLabel}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 px-5 pb-5">
            <Field>
              <FieldLabel className="font-extrabold text-[#f2f3f5] text-base">
                Channel Type
              </FieldLabel>
              <FieldContent>
                <RadioGroup
                  className="gap-1.5 pt-2"
                  onValueChange={(value) =>
                    onKindChange(value as "text" | "voice")
                  }
                  value={kind}
                >
                  {channelTypeOptions.map((option) => {
                    const Icon = option.icon;

                    return (
                      <button
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          kind === option.value
                            ? "border-[#4e5ae8] bg-[#36393f] text-[#f2f3f5]"
                            : "border-transparent bg-transparent text-[#dbdee1] hover:bg-[#32353b] hover:text-[#f2f3f5]"
                        )}
                        key={option.value}
                        onClick={() => onKindChange(option.value)}
                        type="button"
                      >
                        <RadioGroupItem
                          aria-label={
                            option.value === "text" ? "Text" : "Voice"
                          }
                          className="border-[#80848e] data-checked:border-[#5865f2] data-checked:bg-[#5865f2]"
                          value={option.value}
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Icon className="size-4 shrink-0 text-[#dbdee1]" />
                          <div className="font-medium text-base">
                            {option.value === "text" ? "Text" : "Voice"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </RadioGroup>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel
                className="font-extrabold text-[#f2f3f5] text-base"
                htmlFor="channel-name"
              >
                Channel Name
              </FieldLabel>
              <FieldContent>
                <InputGroup className="mt-2 h-11 rounded-xl border border-[#1e1f22] bg-[#1e1f22] shadow-none">
                  <InputGroupAddon
                    align="inline-start"
                    className="border-0 bg-transparent pl-3 text-[#b5bac1]"
                  >
                    <InputGroupText className="bg-transparent px-0 text-[#b5bac1] text-[1.15rem]">
                      {kind === "text" ? (
                        "#"
                      ) : (
                        <Volume2Icon className="size-4" />
                      )}
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    className="border-0 bg-transparent px-3 text-[#f2f3f5] text-sm shadow-none placeholder:text-[#80848e] focus-visible:ring-0"
                    id="channel-name"
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder={
                      kind === "text" ? "new-channel" : "new-voice-channel"
                    }
                    value={name}
                  />
                </InputGroup>
              </FieldContent>
            </Field>

            <div className="flex items-start gap-3 rounded-xl">
              <LockIcon className="mt-0.5 size-4 shrink-0 text-[#b5bac1]" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[#f2f3f5] text-base">
                  Private Channel
                </div>
                <div className="pt-0.5 text-[#b5bac1] text-sm leading-5">
                  Only selected members and roles will be able to view this
                  channel.
                </div>
              </div>
              <Switch
                checked={access === "private"}
                className="mt-0.5 data-checked:bg-[#5865f2] data-unchecked:bg-[#4e5058]"
                onCheckedChange={(checked) =>
                  onAccessChange(checked ? "private" : "public")
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-[#232428] border-t px-5 py-4">
            <DialogClose
              render={<Button className="min-w-28" variant="secondary" />}
            >
              Cancel
            </DialogClose>
            <Button
              className="min-w-36 bg-[#5865f2] text-white hover:bg-[#4752c4]"
              disabled={!name.trim()}
              type="submit"
            >
              Create Channel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
