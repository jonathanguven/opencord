import { HashIcon, Volume2Icon } from "lucide-react";
import type { FormEvent } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
                    id="handle"
                    onChange={(event) => onHandleChange(event.target.value)}
                    placeholder="opencord-user"
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
  name: string;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  open: boolean;
}

export function CreateServerDialog({
  description,
  name,
  onDescriptionChange,
  onNameChange,
  onOpenChange,
  onSubmit,
  open,
}: CreateServerDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
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
                  onChange={(event) => onNameChange(event.target.value)}
                  placeholder="Weekend raid squad"
                  value={name}
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="server-description">Description</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="server-description"
                  onChange={(event) => onDescriptionChange(event.target.value)}
                  placeholder="Tight-knit group for late-night raids and weekend co-op."
                  rows={4}
                  value={description}
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
  );
}

interface CreateChannelDialogProps {
  access: "public" | "private";
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
  kind,
  name,
  onAccessChange,
  onKindChange,
  onNameChange,
  onOpenChange,
  onSubmit,
  open,
}: CreateChannelDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
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
                onValueChange={(value) =>
                  value[0]
                    ? onKindChange(value[0] as "text" | "voice")
                    : undefined
                }
                value={[kind]}
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
                onValueChange={(value) =>
                  value[0]
                    ? onAccessChange(value[0] as "public" | "private")
                    : undefined
                }
                value={[access]}
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
                  onChange={(event) => onNameChange(event.target.value)}
                  placeholder={kind === "text" ? "strategy-room" : "squad-chat"}
                  value={name}
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
  );
}
