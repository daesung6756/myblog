import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-white px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Option A (gradient-friendly) defaults
        "border-[#6b46ff]/20 hover:border-[#8b5cf6]/40",
        "focus:outline-none focus-visible:border-[#6b46ff]/40 focus-visible:ring-2 focus-visible:ring-[#6b46ff]/40",
        // Dark mode variants
        "dark:border-[#4c1d95]/30 dark:focus-visible:ring-[#7c3aed]/35",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
