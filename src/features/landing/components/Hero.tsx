"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowRight, ChevronRight } from "lucide-react"
import { DashboardPreview } from "./DashboardPreview"
import { Container } from "@/components/common/Container"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Heading } from "@/components/common/Heading"
import { Badge } from "@/components/common/Badge"
import { cn } from "@/lib/utils"


export function Hero() {
  return (
    <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-radial-gradient">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text Left Column */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full"
            >
              <Badge variant="glow" className="px-1.5 py-0 text-[10px] bg-primary/25 border-primary/30 text-primary font-semibold">NEW</Badge>
              <span className="text-xs font-semibold text-primary">Sprint 1.1 Live: Frontend Foundation</span>
              <ChevronRight className="size-3 text-primary animate-pulse" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Heading level="h1" gradient="text" className="font-extrabold tracking-tight">
                Understand Any <span className="bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">Codebase</span> Instantly.
              </Heading>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal"
            >
              CodeAtlas helps developers understand repositories using AI-powered software intelligence. Search, analyze, and visualize complex codebases in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white shadow-md font-semibold flex items-center justify-center gap-2 group h-11 px-6">
                Get Started
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
              <Link
                href="#roadmap"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto font-semibold h-11 px-6 border-border hover:bg-muted/40 flex items-center justify-center text-sm"
                )}
              >
                View Roadmap
              </Link>
            </motion.div>
          </div>

          {/* Graphic Dashboard Right Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="lg:col-span-7 w-full"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </Container>
    </div>
  )
}
