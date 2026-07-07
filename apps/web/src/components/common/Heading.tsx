import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva("font-semibold tracking-tight text-foreground", {
  variants: {
    level: {
      h1: "text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1]",
      h2: "text-3xl sm:text-4xl md:text-5xl leading-tight",
      h3: "text-2xl sm:text-3xl leading-snug",
      h4: "text-xl sm:text-2xl leading-7",
      h5: "text-lg sm:text-xl leading-6",
      h6: "text-base sm:text-lg leading-5",
    },
    gradient: {
      none: "",
      primary: "bg-gradient-to-r from-blue-400 via-primary to-secondary bg-clip-text text-transparent",
      text: "bg-gradient-to-b from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent",
    },
  },
  defaultVariants: {
    level: "h2",
    gradient: "none",
  },
})

interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export function Heading({
  className,
  level = "h2",
  gradient,
  as,
  ...props
}: HeadingProps) {
  const Tag = as || (level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6")
  return (
    <Tag
      className={cn(headingVariants({ level, gradient, className }))}
      {...props}
    />
  )
}
