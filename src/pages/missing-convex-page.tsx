import { AudioLinesIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MissingConvexPage() {
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
          <div className="rounded-xl border border-border/70 border-dashed bg-muted/30 p-4 font-mono text-muted-foreground text-sm">
            VITE_CONVEX_URL=
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
