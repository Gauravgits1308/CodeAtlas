"use client"

import * as React from "react"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"
import { Badge } from "@/components/common/Badge"
import { 
  Terminal, 
  Play, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Database, 
  Sparkles
} from "lucide-react"

export function Documentation() {
  const steps = [
    { num: "01", title: "GitHub OAuth", desc: "Authenticate with Clerk and connect your GitHub profile." },
    { num: "02", title: "Select Repo", desc: "Import any public or private repository from your dashboard." },
    { num: "03", title: "Index & Chunk", desc: "Our background BullMQ worker extracts and chunks files." },
    { num: "04", title: "Query AI", desc: "Ask questions, review flowcharts, and get system summaries." },
  ]

  const coreFeatures = [
    { title: "Repository Analysis", desc: "Extract code sizes, file structures, dependencies, and syntax-aware stats." },
    { title: "AI Chat Assistant", desc: "A smart assistant trained on your specific chunked source code contents." },
    { title: "Semantic Search", desc: "Search functions and behaviors in plain English using vector databases." },
    { title: "Auto Documentation", desc: "Generate contextual walkthroughs, design diagrams, and setup instructions." },
    { title: "Code Metrics", desc: "Real-time lines of code charts, language density, and complexity scores." },
  ]

  const comingSoon = [
    "Team Workspaces & Collaboration",
    "Multi-Repository Cross-Search",
    "Pull Request Intelligence & Auto-Reviews",
    "Automated AI Code Refactoring Suggestions",
    "Direct IDE Extensions (VS Code / JetBrains)",
  ]

  const flowSteps = [
    "GitHub",
    "Import",
    "Clone",
    "Analysis",
    "Chunking",
    "Embeddings",
    "Vector DB",
    "AI Chat"
  ]

  return (
    <Section id="documentation" className="border-t border-border/40 bg-[#0B0F19]">
      <Container className="space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="purpleGlow" className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase">
            Documentation
          </Badge>
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Developer <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Quick Start</span>
          </Heading>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Get up and running with CodeAtlas in minutes. No complex configuration required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-6xl mx-auto">
          {/* Left Column: Quickstart & Architecture */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Quickstart steps */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Terminal className="size-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Getting Started</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {steps.map((step) => (
                  <div key={step.num} className="bg-[#111827]/40 border border-border/30 rounded-xl p-5 backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary font-mono">{step.num}</span>
                      <Play className="size-3 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground">{step.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Overview */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Cpu className="size-5 text-emerald-400" />
                <h3 className="text-xl font-bold text-foreground">Architecture Pipeline Flow</h3>
              </div>
              <div className="bg-[#111827]/30 border border-border/20 rounded-xl p-6 backdrop-blur-md">
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  CodeAtlas processes repositories through a secure background execution pipeline. Here is how your code flows from source control to semantic AI answers:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
                  {flowSteps.map((step, idx) => (
                    <React.Fragment key={step}>
                      <div className="bg-card/60 border border-border/40 rounded-lg px-3 py-1.5 text-[11px] font-mono font-semibold text-foreground flex items-center gap-1.5 shadow-sm">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {step}
                      </div>
                      {idx < flowSteps.length - 1 && (
                        <ArrowRight className="size-3.5 text-muted-foreground/50 shrink-0 hidden sm:block" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Tech Stack details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-amber-400" />
                <h3 className="text-xl font-bold text-foreground">System Specifications</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                CodeAtlas is engineered with high-throughput backend technologies. Codebase imports are cloned to temporary sandboxed worker paths, processed using regular expression sliding-window chunk division, and parsed via concrete AI embedding providers (OpenRouter API). Vectors are safely persisted to **PostgreSQL** using raw SQL mappings via **pgvector** and **Prisma ORM**, with queues throttled by **Redis** and **BullMQ**.
              </p>
            </div>
          </div>

          {/* Right Column: Core Features & Roadmap */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Core Features */}
            <div className="bg-[#111827]/20 border border-border/20 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Database className="size-4.5 text-purple-400" />
                <span>Feature Schema</span>
              </h3>
              <div className="space-y-4">
                {coreFeatures.map((feat) => (
                  <div key={feat.title} className="space-y-1.5 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-primary" />
                      {feat.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-[#111827]/40 border border-border/30 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-4.5 text-amber-400 animate-pulse" />
                <span>What&apos;s Next?</span>
              </h3>
              <div className="space-y-2.5">
                {comingSoon.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </Container>
    </Section>
  )
}
