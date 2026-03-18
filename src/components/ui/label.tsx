import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface LabelProps extends ComponentProps<"label"> {
  children?: ReactNode;
}

function Label({ children, className, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: This is a reusable label wrapper; concrete usage sites provide htmlFor or nested controls.
    <label
      className={cn(
        "flex select-none items-center gap-2 font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        className
      )}
      data-slot="label"
      {...props}
    >
      {children}
    </label>
  );
}

export { Label };
