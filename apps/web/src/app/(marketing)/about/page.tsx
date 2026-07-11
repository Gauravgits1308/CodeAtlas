"use client"

import * as React from "react"
import { Container } from "@/components/common/Container"
import { Heading } from "@/components/common/Heading"
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

export default function AboutPage() {
  const techStack = [
    { name: "Next.js", type: "Frontend Framework", color: "border-slate-500/30 text-slate-300" },
    { name: "React", type: "UI Library", color: "border-sky-500/30 text-sky-400" },
    { name: "TypeScript", type: "Programming Language", color: "border-blue-500/30 text-blue-400" },
    { name: "Node.js", type: "Runtime Environment", color: "border-emerald-500/30 text-emerald-400" },
    { name: "Express", type: "Backend API Framework", color: "border-gray-500/30 text-gray-300" },
    { name: "PostgreSQL", type: "Relational Database", color: "border-indigo-500/30 text-indigo-400" },
    { name: "pgvector", type: "Vector Storage Extension", color: "border-cyan-500/30 text-cyan-400" },
    { name: "Redis", type: "Cache & Queue Store", color: "border-rose-500/30 text-rose-400" },
    { name: "BullMQ", type: "Background Queue", color: "border-orange-500/30 text-orange-400" },
    { name: "Prisma", type: "Next-gen ORM", color: "border-teal-500/30 text-teal-400" },
    { name: "Clerk", type: "Authentication Provider", color: "border-purple-500/30 text-purple-400" },
    { name: "OpenRouter", type: "AI Model Provider", color: "border-pink-500/30 text-pink-400" },
  ]

  const features = [
    {
      title: "AI Repository Analysis",
      description: "Automatically index codebase directory structure, analyze complexity, count language metrics, and evaluate files.",
      icon: BrainCircuit,
    },
    {
      title: "Semantic Code Search",
      description: "Find logic patterns and functions using natural language queries powered by high-dimensional vector embeddings.",
      icon: Search,
    },
    {
      title: "Repository Chat",
      description: "Discuss, troubleshoot, and plan changes directly with an AI assistant that understands your entire workspace architecture.",
      icon: MessageSquareCode,
    },
    {
      title: "Documentation Generation",
      description: "Auto-generate clear summaries, visual flowcharts, setup walkthroughs, and code comments directly from source files.",
      icon: FileSpreadsheet,
    },
    {
      title: "Code Intelligence",
      description: "Understand complex control flow paths, verify package requirements, and detect critical security flaws instantly.",
      icon: Terminal,
    },
    {
      title: "Developer Productivity",
      description: "Banish onboarding latency by letting new engineering hires ask direct system questions and obtain working walkthroughs.",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="py-20 bg-[#0B0F19] text-foreground min-h-screen">
      <Container className="space-y-24">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge variant="purpleGlow" className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase">
            About the Project
          </Badge>
          <Heading level="h1" className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            About CodeAtlas
          </Heading>
          <p className="text-lg sm:text-xl text-muted-foreground/80 leading-relaxed">
            CodeAtlas is an AI-powered developer platform designed to help engineers understand, analyze, search, and document complex codebases using modern AI technologies. By mapping your repository architecture, CodeAtlas builds a semantic graph of your application to accelerate onboarding and maximize productivity.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-[#111827]/30 border border-border/20 rounded-2xl p-8 sm:p-12 backdrop-blur-md max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Network className="size-6" />
            </div>
            <Heading level="h2" className="text-2xl sm:text-3xl font-bold">
              Our Mission
            </Heading>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Modern engineering teams spend more time reading, researching, and tracing codebases than actually writing features. CodeAtlas aims to solve this complexity gap. Our mission is to democratize repository understanding by providing developers with context-aware, instantaneous codebase intelligence that turns unfamiliar repositories into searchable, chat-accessible documentation.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="space-y-10">
          <div className="text-center space-y-3">
            <Heading level="h2" className="text-2xl sm:text-4xl font-extrabold">
              Key Features
            </Heading>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              CodeAtlas integrates semantic search, chat, and metrics directly into a single unified developer dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div 
                  key={idx}
                  className="bg-[#111827]/40 border border-border/30 hover:border-border/50 rounded-2xl p-6 backdrop-blur-sm hover:-translate-y-1 transform duration-200 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary w-fit">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tech Stack badging */}
        <div className="space-y-10 max-w-5xl mx-auto">
          <div className="text-center space-y-3">
            <Heading level="h2" className="text-2xl sm:text-4xl font-extrabold">
              Technology Stack
            </Heading>
            <p className="text-sm sm:text-base text-muted-foreground">
              Built on a foundation of high-performance modern database tools and background processors.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {techStack.map((tech, idx) => (
              <div 
                key={idx}
                className={`bg-[#111827]/25 border ${tech.color} rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1 backdrop-blur-sm`}
              >
                <span className="font-bold text-sm text-foreground">{tech.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{tech.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Long term Vision */}
        <div className="bg-[#111827]/30 border border-border/20 rounded-2xl p-8 sm:p-12 backdrop-blur-md max-w-5xl mx-auto text-center space-y-6">
          <Heading level="h2" className="text-2xl sm:text-3xl font-bold">
            The Vision Ahead
          </Heading>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            CodeAtlas aspires to become the universal semantic layer for software engineering. By providing automated PR reviews, smart issue debugging suggestions, and interactive system walk-through tools directly in the cloud, we strive to build a future where developers can collaborate with AI partners to build reliable systems faster than ever.
          </p>
        </div>

      </Container>
    </div>
  )
}
