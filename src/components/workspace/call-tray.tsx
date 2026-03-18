import {
  AudioLinesIcon,
  MicIcon,
  MicOffIcon,
  MonitorUpIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActiveCall } from "@/components/workspace/workspace-types";

interface CallTrayProps {
  activeCall: ActiveCall | null;
  isConnecting: boolean;
  onDeafen: () => void;
  onLeave: () => void;
  onMute: () => void;
  onShareScreen: () => void;
}

export function CallTray({
  activeCall,
  isConnecting,
  onDeafen,
  onLeave,
  onMute,
  onShareScreen,
}: CallTrayProps) {
  if (!activeCall) {
    return (
      <div className="border-border/60 border-t px-4 py-3">
        <div className="flex items-center justify-between rounded-2xl border border-border/70 border-dashed bg-muted/20 px-4 py-3 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <AudioLinesIcon />
            No active call. Join a voice room or start a DM session.
          </div>
          <Badge variant="outline">Idle</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border/60 border-t px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/8 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{activeCall.label}</div>
          <div className="truncate text-muted-foreground text-xs">
            Room {activeCall.roomKey} • Session{" "}
            {activeCall.sessionId?.slice(0, 8) ?? "connecting"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onMute}
            size="icon-sm"
            variant={activeCall.muted ? "secondary" : "outline"}
          >
            {activeCall.muted ? <MicOffIcon /> : <MicIcon />}
          </Button>
          <Button
            onClick={onDeafen}
            size="icon-sm"
            variant={activeCall.deafened ? "secondary" : "outline"}
          >
            {activeCall.deafened ? <VolumeXIcon /> : <Volume2Icon />}
          </Button>
          <Button
            disabled
            onClick={onShareScreen}
            size="icon-sm"
            variant="outline"
          >
            <MonitorUpIcon />
          </Button>
          <Button onClick={onLeave} variant="destructive">
            {isConnecting ? "Cancel" : "Leave call"}
          </Button>
        </div>
      </div>
    </div>
  );
}
