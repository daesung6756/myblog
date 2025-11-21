import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Option A (gradient-friendly) defaults
        "border-[#6b46ff]/20 hover:border-[#8b5cf6]/40",
        "focus:outline-none focus-visible:border-[#6b46ff]/40 focus-visible:ring-2 focus-visible:ring-[#6b46ff]/40",
        // Dark mode variants
        "dark:border-[#4c1d95]/30 dark:focus-visible:ring-[#7c3aed]/35",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
