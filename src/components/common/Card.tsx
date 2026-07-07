"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
  glowColor?: "blue" | "purple" | "none"
}

export function Card({
  className,
  hoverEffect = true,
  glowColor = "none",
  children,
  ...props
}: CardProps) {
  const glowStyles = {
    blue: "hover:border-primary/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    purple: "hover:border-secondary/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    none: "hover:border-foreground/20",
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all duration-300",
        hoverEffect && "hover:-translate-y-1",
        hoverEffect && glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
