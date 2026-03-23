import { Volume2Icon } from "lucide-react";
import { type CSSProperties, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ActiveCall } from "./workspace-types";

interface VoiceChannelPanelProps {
  activeCall: ActiveCall | null;
  channel: Doc<"channels">;
  onJoin: () => void;
}

export function VoiceChannelPanel({
  activeCall,
  channel,
  onJoin,
}: VoiceChannelPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const currentPositionRef = useRef({ x: 50, y: 50 });
  const targetPositionRef = useRef({ x: 50, y: 50 });
  const joined =
    activeCall?.kind === "voice" && activeCall.channelId === channel._id;

  useEffect(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const updateGradient = () => {
      const current = currentPositionRef.current;
      const target = targetPositionRef.current;
      const smoothing = 0.09;

      current.x += (target.x - current.x) * smoothing;
      current.y += (target.y - current.y) * smoothing;

      panel.style.setProperty("--voice-gradient-x", `${current.x}%`);
      panel.style.setProperty("--voice-gradient-y", `${current.y}%`);

      const stillMoving =
        Math.abs(target.x - current.x) > 0.1 ||
        Math.abs(target.y - current.y) > 0.1;

      if (stillMoving) {
        frameRef.current = window.requestAnimationFrame(updateGradient);
        return;
      }

      frameRef.current = null;
    };

    const ensureAnimation = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(updateGradient);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = panel.getBoundingClientRect();
      const relativeX = ((event.clientX - bounds.left) / bounds.width) * 100;
      const relativeY = ((event.clientY - bounds.top) / bounds.height) * 100;

      targetPositionRef.current = {
        x: Math.max(0, Math.min(100, relativeX)),
        y: Math.max(0, Math.min(100, relativeY)),
      };
      ensureAnimation();
    };

    const handlePointerLeave = () => {
      targetPositionRef.current = { x: 50, y: 50 };
      ensureAnimation();
    };

    panel.style.setProperty("--voice-gradient-x", "50%");
    panel.style.setProperty("--voice-gradient-y", "50%");

    panel.addEventListener("pointermove", handlePointerMove);
    panel.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      panel.removeEventListener("pointermove", handlePointerMove);
      panel.removeEventListener("pointerleave", handlePointerLeave);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative flex h-full items-center justify-center overflow-hidden bg-[#090916]"
      ref={panelRef}
      style={
        {
          "--voice-gradient-x": "50%",
          "--voice-gradient-y": "50%",
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-95"
        style={{
          background: `
            radial-gradient(circle at var(--voice-gradient-x) var(--voice-gradient-y), rgb(123 141 255 / 0.38), transparent 26%),
            radial-gradient(circle at calc(var(--voice-gradient-x) * 0.55) calc(var(--voice-gradient-y) * 0.75), rgb(86 99 242 / 0.32), transparent 30%),
            radial-gradient(circle at 50% 115%, rgb(71 82 196 / 0.55), transparent 42%),
            linear-gradient(180deg, #0e1027 0%, #171a49 48%, #21246a 100%)
          `,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgb(255 255 255 / 0.7) 0.7px, transparent 0.7px)",
          backgroundSize: "7px 7px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.08),transparent_38%,transparent_62%,rgb(255_255_255/0.03))]"
      />
      <Button
        aria-label={`Join ${channel.name}`}
        className="relative h-14 rounded-2xl bg-white px-7 font-semibold text-[#111320] shadow-[0_18px_50px_rgb(4_6_26/0.45)] transition-transform duration-200 hover:scale-[1.03] hover:bg-white"
        onClick={onJoin}
        size="lg"
      >
        <Volume2Icon data-icon="inline-start" />
        {joined ? "Rejoin Voice" : "Join Voice"}
      </Button>
    </div>
  );
}
