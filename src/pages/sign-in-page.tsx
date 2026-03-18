import { useAuthActions } from "@convex-dev/auth/react";
import {
  AudioLinesIcon,
  BellIcon,
  Loader2Icon,
  MessageSquareIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface SignInPageProps {
  onError: (error: unknown) => string;
}

export function SignInPage({ onError }: SignInPageProps) {
  const { signIn } = useAuthActions();
  const [isPending, setIsPending] = useState<string | null>(null);

  const startSignIn = async (provider: "discord" | "google" | "anonymous") => {
    setIsPending(provider);

    try {
      await signIn(provider, { redirectTo: window.location.href });
    } catch (error) {
      toast.error(onError(error));
    } finally {
      setIsPending(null);
    }
  };

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
                  <h1 className="max-w-xl font-semibold text-4xl tracking-tight sm:text-5xl">
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
                    <Card className="bg-background/70" key={item.title}>
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
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
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
                  <Badge className="w-fit" variant="outline">
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
                    onClick={async () => {
                      await startSignIn("discord");
                    }}
                    size="lg"
                  >
                    {isPending === "discord" ? (
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <MessageSquareIcon data-icon="inline-start" />
                    )}
                    Continue with Discord
                  </Button>
                  <Button
                    className="w-full justify-center"
                    disabled={Boolean(isPending)}
                    onClick={async () => {
                      await startSignIn("google");
                    }}
                    size="lg"
                    variant="secondary"
                  >
                    {isPending === "google" ? (
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <SearchIcon data-icon="inline-start" />
                    )}
                    Continue with Google
                  </Button>
                  <Button
                    className="w-full justify-center"
                    disabled={Boolean(isPending)}
                    onClick={async () => {
                      await startSignIn("anonymous");
                    }}
                    size="lg"
                    variant="outline"
                  >
                    {isPending === "anonymous" ? (
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <UsersIcon data-icon="inline-start" />
                    )}
                    Use local guest mode
                  </Button>
                </CardContent>
                <CardFooter className="justify-between gap-3 text-muted-foreground text-sm">
                  <span>Invite-only communities. No public discovery.</span>
                  <Badge variant="secondary">MVP shell</Badge>
                </CardFooter>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
