import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  clean?: boolean
}

export function Container({ className, clean = false, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        !clean && "max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    />
  )
}
