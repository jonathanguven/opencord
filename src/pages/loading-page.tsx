import { Skeleton } from "@/components/ui/skeleton";

const RAIL_SKELETON_KEYS = [
  "rail-1",
  "rail-2",
  "rail-3",
  "rail-4",
  "rail-5",
  "rail-6",
] as const;

const COLUMN_SKELETON_KEYS = ["column-1", "column-2", "column-3"] as const;

export function LoadingPage() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <div className="flex w-18 flex-col items-center gap-3 border-border/60 border-r bg-sidebar px-3 py-4">
        {RAIL_SKELETON_KEYS.map((key) => (
          <Skeleton className="size-12 rounded-2xl" key={key} />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_260px]">
        {COLUMN_SKELETON_KEYS.map((key) => (
          <div
            className="flex flex-col gap-4 border-border/60 border-r p-4 last:border-r-0"
            key={key}
          >
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
