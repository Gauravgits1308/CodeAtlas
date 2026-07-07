"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle } from "lucide-react"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"
import { Badge } from "@/components/common/Badge"
import { ROADMAP } from "@/constants/landingData"
import { cn } from "@/lib/utils"

export function Roadmap() {
  return (
    <Section id="roadmap" className="border-t border-border/40 bg-[#0B0F19]/50">
      <Container className="space-y-16">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            CodeAtlas <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Product Roadmap</span>
          </Heading>
          <p className="text-base text-muted-foreground max-w-xl mx-auto font-normal">
            Our vision for scaling software intelligence. Review our phases from core UI foundation to distributed enterprise architectures.
          </p>
        </div>

        {/* Timeline List */}
        <div className="relative max-w-3xl mx-auto pl-6 border-l border-border/60 space-y-10">
          {ROADMAP.map((item, index) => {
            const isCompleted = item.status === "Completed"
            const isInProgress = item.status === "In Progress"

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="relative group"
              >
                {/* Timeline Dot Indicator */}
                <span className="absolute -left-[31px] top-1.5 flex items-center justify-center size-4 rounded-full bg-background border border-border">
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 text-emerald-400 fill-emerald-400/10 shrink-0" />
                  ) : isInProgress ? (
                    <span className="size-2 rounded-full bg-primary animate-ping shrink-0" />
                  ) : (
                    <Circle className="size-3 text-muted-foreground/60 shrink-0" />
                  )}
                </span>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-semibold text-primary/80">Phase {item.phase}</span>
                    <Heading level="h4" className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </Heading>
                    <Badge
                      variant={isCompleted ? "glow" : isInProgress ? "purpleGlow" : "muted"}
                      className={cn(
                        "text-[10px] px-2 py-0.5",
                        isCompleted && "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
                        isInProgress && "bg-primary/10 text-primary border-primary/20",
                        !isCompleted && !isInProgress && "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
