import { BellIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InvitePlaceholderPage() {
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
  );
}
