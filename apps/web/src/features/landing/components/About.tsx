"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Container } from "@/components/common/Container"
import { Section } from "@/components/common/Section"
import { Heading } from "@/components/common/Heading"
import { Card } from "@/components/common/Card"
import { Badge } from "@/components/common/Badge"
import { 
  BrainCircuit, 
  Search, 
  MessageSquareCode, 
  FileSpreadsheet, 
  Terminal, 
  TrendingUp, 
  Network
} from "lucide-react"

export function About() {
  const techStack = [
    { name: "Next.js", type: "Frontend Framework", color: "border-slate-500/30 text-slate-300" },
    { name: "React", type: "UI Library", color: "border-sky-500/30 text-sky-400" },
    { name: "TypeScript", type: "Programming Language", color: "border-blue-500/30 text-blue-400" },
    { name: "Node.js", type: "Runtime Environment", color: "border-emerald-500/30 text-emerald-400" },
    { name: "Express", type: "Backend API", color: "border-gray-500/30 text-gray-300" },
    { name: "PostgreSQL", type: "Relational Database", color: "border-indigo-500/30 text-indigo-400" },
    { name: "Prisma", type: "Next-gen ORM", color: "border-teal-500/30 text-teal-400" },
    { name: "Redis", type: "Queue & Cache", color: "border-rose-500/30 text-rose-400" },
    { name: "BullMQ", type: "Background Tasks", color: "border-orange-500/30 text-orange-400" },
    { name: "Clerk", type: "Auth Service", color: "border-purple-500/30 text-purple-400" },
    { name: "OpenRouter", type: "AI Integration", color: "border-pink-500/30 text-pink-400" },
    { name: "pgvector", type: "Vector Store", color: "border-cyan-500/30 text-cyan-400" },
  ]

  const features = [
    {
      title: "AI Repository Intelligence",
      description: "Index codebase directories, analyze patterns, compute complexity scores, and parse file dependencies.",
      icon: BrainCircuit,
    },
    {
      title: "Semantic Search",
      description: "Search functions, classes, and logic using natural language queries powered by pgvector.",
      icon: Search,
    },
    {
      title: "Repository Chat",
      description: "Discuss refactoring, debug issues, and explain architecture with an LLM that knows your codebase.",
      icon: MessageSquareCode,
    },
    {
      title: "Documentation Generation",
      description: "Generate markdown docs, diagrams, walkthroughs, and inline comments from source code.",
      icon: FileSpreadsheet,
    },
    {
      title: "Code Understanding",
      description: "Trace data flow and control blocks. CodeAtlas maps syntax boundaries for precise suggestions.",
      icon: Terminal,
    },
    {
      title: "Developer Productivity",
      description: "Reduce onboarding latency. New hires ask direct questions and obtain instantly summarized contexts.",
      icon: TrendingUp,
    },
  ]

  return (
    <Section id="about" className="border-t border-border/40 bg-[#0B0F19]">
      <Container className="space-y-20">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="purpleGlow" className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase">
            About CodeAtlas
          </Badge>
          <Heading level="h2" className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Our Mission & <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Vision</span>
          </Heading>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            CodeAtlas bridges the gap between massive software architectures and engineer comprehension.
          </p>
        </div>

        {/* Mission Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2xl font-bold text-foreground">
              Simplifying Codebases at Scale
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Software codebases are growing larger and more complex. Engineers spend up to 70% of their time reading and understanding code rather than writing it.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Our mission is to help developers instantly understand, search, chat, and write documentation for complex repositories using modern AI technologies. By mapping your repository architecture, CodeAtlas builds a semantic database of your application to maximize onboarding speed and workspace focus.
            </p>
          </div>
          <div className="lg:col-span-5 bg-[#111827]/40 border border-border/30 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <Network className="size-5 text-primary" />
              <span className="font-bold text-sm text-foreground">Semantic Graph Map</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our indexer analyzes repository directories, splits files into semantic chunks, generates vector embeddings via OpenRouter, and stores high-dimensional records in pgvector to provide lightning-fast, context-rich results.
            </p>
          </div>
        </div>

        {/* Why CodeAtlas Grid */}
        <div className="space-y-8 max-w-6xl mx-auto">
          <Heading level="h3" className="text-xl sm:text-2xl font-bold text-center">
            Why CodeAtlas?
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card
                    hoverEffect={true}
                    glowColor={idx % 2 === 0 ? "blue" : "purple"}
                    className="h-full flex flex-col gap-4 p-6 select-none bg-card/40 backdrop-blur-sm border-border/40 hover:border-border transition-all"
                  >
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground text-base">{feat.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Built With Grid */}
        <div className="space-y-8 max-w-5xl mx-auto pt-8">
          <Heading level="h3" className="text-xl sm:text-2xl font-bold text-center">
            Built With
          </Heading>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {techStack.map((tech, idx) => (
              <div 
                key={idx}
                className={`bg-[#111827]/25 border ${tech.color} rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1 backdrop-blur-sm hover:scale-[1.02] transition-all`}
              >
                <span className="font-bold text-sm text-foreground">{tech.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tech.type}</span>
              </div>
            ))}
          </div>
        </div>

      </Container>
    </Section>
  )
}
