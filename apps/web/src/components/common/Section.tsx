import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string
}

export function Section({ className, id, ...props }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24 lg:py-32 overflow-hidden relative scroll-mt-20",
        className
      )}
      {...props}
    />
  )
}
