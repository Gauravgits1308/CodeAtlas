"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ChevronRight,
  Github,
  Terminal,
  Search,
  Check,
  X,
  Play,
  Sparkles,
  GitBranch,
  Lock,
  Globe,
  Plus,
  Minus,
  Folder,
  FileCode2,
  Database,
  Cpu,
  RefreshCw,
  Workflow
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/common/Container"
import { Heading } from "@/components/common/Heading"
import { Card } from "@/components/common/Card"
import { FEATURES, FAQS } from "@/constants/landingData"
import { cn } from "@/lib/utils"

// ----------------------------------------------------
// 3-STEP MINIMAL PIPELINE TIMELINE COMPONENT
// ----------------------------------------------------

function MinimalPipeline() {
  const steps = [
    {
      step: "01",
      title: "Import Repository",
      desc: "Connect any public or private GitHub repository via secure OAuth."
    },
    {
      step: "02",
      title: "AI Processing",
      desc: "AST syntax parsing, vector embeddings, and dependency graph mapping."
    },
    {
      step: "03",
      title: "Engineering Intelligence",
      desc: "Explore architecture, ask grounded queries, and generate documentation."
    }
  ]

  return (
    <div className="w-full py-8 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
        {steps.map((s, idx) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: idx * 0.1 }}
            className="p-6 rounded-2xl border border-border/15 bg-[#0F1420]/40 backdrop-blur-md text-left flex flex-col justify-between space-y-4 hover:border-primary/30 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                {s.step}
              </span>
              {idx < 2 && (
                <ArrowRight className="size-4 text-muted-foreground/40 hidden md:block group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              )}
            </div>
            <div className="space-y-1.5">
              <h3 className="font-sans text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {s.title}
              </h3>
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-sans">
                {s.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ----------------------------------------------------
// CODE-BASED ILLUSTRATIONS (VISUAL STORYTELLING)
// ----------------------------------------------------

function SemanticSearchVisualization() {
  const [activeQueryIdx, setActiveQueryIdx] = React.useState(0)
  const queries = ["JWT token validation", "bullmq job scheduler", "database migration prisma"]
  const queryMatches = [
    [
      { file: "src/lib/auth.ts", score: 98, match: "export function verifyAccessToken(token)" },
      { file: "src/middleware.ts", score: 89, match: "const token = req.headers.get('Authorization')" }
    ],
    [
      { file: "apps/worker/src/index.ts", score: 95, match: "new Worker('repo-processing', async job)" },
      { file: "apps/api/src/services/sse.service.ts", score: 82, match: "redis.subscribe('repo:progress')" }
    ],
    [
      { file: "prisma/schema.prisma", score: 99, match: "model Repository { id String @id }" },
      { file: "apps/api/src/repositories/repository.ts", score: 86, match: "this.prisma.repository.findUnique" }
    ]
  ]

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveQueryIdx((prev) => (prev + 1) % queries.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [queries.length])

  return (
    <div className="border border-border/10 bg-[#111622]/20 rounded-xl p-4 font-mono text-[10px] space-y-3 text-left max-w-sm mx-auto shadow-xl select-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-center gap-2 border border-border/10 bg-[#0B0F19] px-2.5 py-1.5 rounded-lg transition-all duration-300">
        <Search className="size-3 text-primary shrink-0" />
        <span className="text-foreground truncate font-sans text-[9px] font-medium">Query: &quot;{queries[activeQueryIdx]}&quot;</span>
      </div>
      <div className="space-y-2">
        <div className="text-[7.5px] uppercase tracking-wider font-extrabold text-muted-foreground/50">Vector Cosine Matches</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeQueryIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {queryMatches[activeQueryIdx].map((m) => (
              <div key={m.file} className="p-2 border border-border/10 bg-[#0B0F19]/45 rounded-lg flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="text-[9px] font-semibold text-foreground truncate flex items-center gap-1">
                    <FileCode2 className="size-3 text-primary/70 shrink-0" />
                    <span className="truncate">{m.file}</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground/60 truncate">{m.match}</div>
                </div>
                <span className="text-[8px] font-bold px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded shrink-0">
                  {m.score}% match
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function KnowledgeGraphIllustration() {
  return (
    <div className="border border-border/10 bg-[#111622]/20 rounded-xl p-5 flex flex-col justify-center items-center h-[180px] max-w-sm mx-auto shadow-xl relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-radial-gradient opacity-10" />
      <div className="relative w-full h-full">
        {/* Node Center */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute top-4 left-1/2 -translate-x-1/2 p-2 border border-primary/30 bg-[#0B0F19] rounded shadow-lg z-10 flex items-center gap-1.5 font-mono text-[9px] text-foreground"
        >
          <FileCode2 className="size-3 text-primary" />
          <span>sse.service.ts</span>
        </motion.div>

        {/* Dynamic Connected Lines */}
        <svg className="absolute inset-0 w-full h-full z-0" fill="none">
          <path d="M140 42 L70 120" stroke="rgba(59,130,246,0.35)" strokeWidth="1.2" strokeDasharray="3,3" />
          <path d="M140 42 L200 120" stroke="rgba(59,130,246,0.35)" strokeWidth="1.2" strokeDasharray="3,3" />
          <path d="M70 120 L200 120" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
        </svg>

        {/* Node Left */}
        <div className="absolute bottom-4 left-4 p-2 border border-secondary/30 bg-[#0B0F19] rounded shadow-md z-10 flex items-center gap-1.5 font-mono text-[9px] text-foreground">
          <FileCode2 className="size-3 text-secondary" />
          <span>sse.routes.ts</span>
        </div>

        {/* Node Right */}
        <div className="absolute bottom-4 right-4 p-2 border border-border/30 bg-[#0B0F19] rounded shadow-md z-10 flex items-center gap-1.5 font-mono text-[9px] text-foreground">
          <FileCode2 className="size-3 text-zinc-500" />
          <span>redis.ts</span>
        </div>
      </div>
    </div>
  )
}

function renderMiniUI(title: string) {
  switch (title) {
    case "Repository Intelligence":
      return (
        <div className="w-full border border-border/10 bg-[#0B0F19] p-2 rounded-lg flex justify-between items-center font-mono text-[8px] text-muted-foreground mt-1 shadow-sm select-none">
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-foreground font-semibold">revora-worker</span>
          </div>
          <span>142 dependencies mapped</span>
        </div>
      )
    case "Grounded AI Chat":
      return (
        <div className="w-full border border-border/10 bg-[#0B0F19] p-2.5 rounded-lg space-y-1.5 text-left font-mono text-[8.5px] text-muted-foreground leading-relaxed mt-1 shadow-sm select-none">
          <div className="text-foreground font-bold flex items-center gap-1">
            <Sparkles className="size-2.5 text-primary" />
            <span>Revora Agent</span>
          </div>
          <p className="line-clamp-2 font-sans">Resolved imports via `src/lib/auth.ts` lines 20-35.</p>
        </div>
      )
    case "Architecture Analysis":
      return (
        <div className="w-full border border-border/10 bg-[#0B0F19] p-2 rounded-lg flex items-center gap-1.5 font-mono text-[8.5px] text-muted-foreground justify-center mt-1 shadow-sm select-none">
          <span>routes.ts</span>
          <ArrowRight className="size-2 text-primary" />
          <span>controllers.ts</span>
          <ArrowRight className="size-2 text-primary" />
          <span>db.ts</span>
        </div>
      )
    case "Repository Health":
      return (
        <div className="w-full border border-border/10 bg-[#0B0F19] p-2 rounded-lg flex items-center justify-between font-mono text-[8.5px] text-muted-foreground mt-1 shadow-sm select-none">
          <span>Maintainability Grade</span>
          <span className="text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 border border-emerald-500/10 rounded">A+</span>
        </div>
      )
    case "Semantic Search":
      return (
        <div className="w-full border border-border/10 bg-[#0B0F19] p-2 rounded-lg flex items-center gap-1.5 font-mono text-[8.5px] text-muted-foreground mt-1 shadow-sm select-none">
          <Search className="size-2.5 text-primary" />
          <span className="text-foreground font-semibold">&quot;token validator&quot;</span>
          <span className="text-muted-foreground text-[8px] bg-[#111622] px-1 rounded border border-border/10">match 98%</span>
        </div>
      )
    case "AI Documentation":
      return (
        <div className="w-full border border-border/10 bg-[#0B0F19] p-2 rounded-lg font-mono text-[8px] text-muted-foreground mt-1 shadow-sm select-none text-left">
          <code className="text-secondary font-semibold"># API Integration Guide</code>
          <p className="text-[7.5px] text-muted-foreground/60 leading-tight mt-0.5">Traces endpoint progress hooks...</p>
        </div>
      )
    default:
      return null
  }
}

// ----------------------------------------------------
// MAIN MARKETING HOMEPAGE
// ----------------------------------------------------

export default function Home() {
  const { isSignedIn } = useAuth()
  const [activeShowcase, setActiveShowcase] = React.useState<"dashboard" | "chat" | "architecture" | "health" | "explorer">("chat")
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null)

  // 8-step walking loop inside the Hero browser mockup
  const [heroWalkIdx, setHeroWalkIdx] = React.useState(0)
  const heroWalkSteps = [
    { id: "import", title: "Import Repository", detail: "Initializing OAuth checkout from GitHub..." },
    { id: "indexing", title: "Indexing Files", detail: "Scanning project routes, services, and models..." },
    { id: "embeddings", title: "Generating Embeddings", detail: "Vectorizing code blocks through syntax chunk models..." },
    { id: "graph", title: "Building Knowledge Graph", detail: "Constructing import dependency links..." },
    { id: "ready", title: "Repository Ready", detail: "AST index verification successfully completed." },
    { id: "query", title: "User Asks Question", detail: "\"Where is JWT authentication implemented?\"" },
    { id: "response", title: "AI Grounded Response", detail: "Referencing file path: apps/api/src/lib/auth.ts" },
    { id: "citation", title: "Highlight Referenced Files", detail: "Linking target files: auth.ts, middleware.ts, routes/user.ts" }
  ]

  React.useEffect(() => {
    const timer = setInterval(() => {
      setHeroWalkIdx((prev) => (prev + 1) % heroWalkSteps.length)
    }, 3800)
    return () => clearInterval(timer)
  }, [heroWalkSteps.length])

  const getStartedHref = isSignedIn ? "/onboarding" : "/sign-up"

  return (
    <div className="flex flex-col min-h-screen bg-[#070A13] text-foreground scroll-smooth select-none font-sans antialiased">
      {/* Background radial gradient blobs and ambient grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E2638_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.18] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none blur-[140px]" />
      <div className="absolute top-1/4 left-1/6 w-[450px] h-[450px] bg-secondary/8 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. HERO SECTION */}
      <section id="home" className="relative min-h-[90vh] lg:min-h-[92vh] flex items-center justify-center pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <Container className="space-y-12 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 xl:gap-16 items-center">
            {/* Left Column Texts (Enterprise Copy) */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full select-none"
              >
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest font-mono text-primary uppercase">Revora Platform</span>
                <ChevronRight className="size-3 text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-[2.65rem] xl:text-[2.85rem] font-bold tracking-tight leading-[1.12] text-foreground max-w-[560px] mx-auto lg:mx-0 font-sans"
              >
                Engineering Intelligence<br />
                <span className="text-muted-foreground/90 font-medium">for every repository.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed max-w-[520px] mx-auto lg:mx-0 font-normal font-sans"
              >
                Transform GitHub repositories into searchable architecture, documentation, dependency insights, and AI-powered engineering knowledge—all within a modern engineering workspace.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3"
              >
                <Link
                  href={getStartedHref}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full sm:w-auto bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-2 group h-12 px-7 rounded-xl cursor-pointer hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 border border-primary/30"
                  )}
                >
                  <span>Start Building Free</span>
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <button
                  onClick={() => {
                    document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto bg-[#0B0F19]/60 backdrop-blur-md border border-border/60 hover:border-primary/40 hover:bg-[#111622]/80 font-semibold h-12 px-7 flex items-center justify-center text-sm rounded-xl cursor-pointer text-muted-foreground hover:text-foreground hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200"
                  )}
                >
                  <Play className="size-3.5 fill-current mr-2" />
                  <span>Explore Workspace</span>
                </button>
              </motion.div>
            </div>

            {/* Right Column: Visual Hero Mockup Browser Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -6, 0]
              }}
              transition={{
                opacity: { duration: 0.6, delay: 0.35 },
                scale: { duration: 0.6, delay: 0.35 },
                y: { duration: 7, repeat: Infinity, ease: "easeInOut" }
              }}
              className="lg:col-span-7 w-full select-none relative"
            >
              {/* Soft ambient glow behind mockup */}
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-[90px] pointer-events-none -z-10" />
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-secondary/15 rounded-full blur-[100px] pointer-events-none -z-10" />

              <div className="relative rounded-xl border border-border/20 bg-[#0F1420]/85 shadow-[0_25px_60px_rgba(0,0,0,0.65)] overflow-hidden backdrop-blur-md">
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                {/* Window header */}
                <div className="flex items-center justify-between px-4 h-10 border-b border-border/10 bg-[#0A0D15] select-none text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-0.5 bg-[#111827] border border-border/15 rounded text-[8px] text-muted-foreground w-1/2 justify-center font-mono">
                    <Search className="size-2.5" />
                    <span>revora.ai/workspace/active</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#111827] px-2 py-0.5 border border-border/15 rounded">
                    <GitBranch className="size-2.5 text-primary" />
                    <span className="font-semibold text-foreground text-[8px] font-mono">main</span>
                  </div>
                </div>

                {/* Walkthrough Stage progress indicator */}
                <div className="bg-[#111827]/70 border-b border-border/10 px-4 py-2 flex items-center justify-between text-[8px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider">
                      Walkthrough State ({heroWalkIdx + 1}/8): {heroWalkSteps[heroWalkIdx].title}
                    </span>
                  </div>
                  <span className="text-[7.5px] text-muted-foreground/60">{heroWalkSteps[heroWalkIdx].detail}</span>
                </div>

                {/* Expanded Mockup transition canvas area */}
                <div className="h-[340px] p-4 bg-[#0B0F19]/45 relative overflow-hidden font-mono text-[9.5px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={heroWalkIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 h-full text-left"
                    >
                      {/* Step 1: Import */}
                      {heroWalkSteps[heroWalkIdx].id === "import" && (
                        <div className="space-y-3">
                          <div className="font-bold text-foreground">Import Repository</div>
                          <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Github className="size-4 text-primary" />
                              <div>
                                <div className="font-semibold text-foreground text-[10px]">revora-api-service</div>
                                <div className="text-[8px] text-muted-foreground">GitHub private repository</div>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-primary text-white text-[8px] font-bold rounded">Connect</span>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Indexing */}
                      {heroWalkSteps[heroWalkIdx].id === "indexing" && (
                        <div className="space-y-3">
                          <div className="font-bold text-foreground">Indexing Codebase Files</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                              <span>Scanning path: apps/api/src/services/sse.service.ts</span>
                              <span className="text-primary font-bold">In progress</span>
                            </div>
                            <div className="w-full bg-[#111622] h-1.5 rounded-full overflow-hidden">
                              <motion.div
                                className="bg-primary h-full rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "42%" }}
                                transition={{ duration: 1.5 }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Embeddings */}
                      {heroWalkSteps[heroWalkIdx].id === "embeddings" && (
                        <div className="space-y-3">
                          <div className="font-bold text-foreground">Generating Code Embeddings</div>
                          <div className="p-2 border border-border/10 bg-[#111622]/45 rounded-lg space-y-1">
                            <div className="flex items-center justify-between text-[8px]">
                              <span className="text-secondary">verifyAccessToken() chunk</span>
                              <span className="text-muted-foreground">Completed</span>
                            </div>
                            <div className="w-full bg-[#111622] h-1 rounded-full overflow-hidden">
                              <div className="bg-secondary h-full rounded-full w-full" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Graph */}
                      {heroWalkSteps[heroWalkIdx].id === "graph" && (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-center font-bold text-foreground mb-3">Connecting Abstract Syntax Tree Nodes</div>
                          <KnowledgeGraphIllustration />
                        </div>
                      )}

                      {/* Step 5: Ready */}
                      {heroWalkSteps[heroWalkIdx].id === "ready" && (
                        <div className="space-y-3">
                          <div className="font-bold text-foreground flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Repository Indexed Successfully</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-2 bg-[#111622]/40 border border-border/10 rounded-lg">
                              <div className="text-[8px] text-muted-foreground uppercase">Traced Modules</div>
                              <div className="text-xs font-extrabold text-foreground">142</div>
                            </div>
                            <div className="p-2 bg-[#111622]/40 border border-border/10 rounded-lg">
                              <div className="text-[8px] text-muted-foreground uppercase">Health Grade</div>
                              <div className="text-xs font-extrabold text-emerald-400">A+</div>
                            </div>
                            <div className="p-2 bg-[#111622]/40 border border-border/10 rounded-lg">
                              <div className="text-[8px] text-muted-foreground uppercase">Index Cache</div>
                              <div className="text-xs font-extrabold text-foreground">100%</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 6: Query */}
                      {heroWalkSteps[heroWalkIdx].id === "query" && (
                        <div className="space-y-4">
                          <div className="font-bold text-foreground">User Query</div>
                          <div className="p-3 bg-[#111622]/45 border border-border/10 rounded-xl max-w-[85%] ml-auto text-right text-foreground font-sans">
                            Where is JWT authentication implemented?
                          </div>
                        </div>
                      )}

                      {/* Step 7: Response */}
                      {heroWalkSteps[heroWalkIdx].id === "response" && (
                        <div className="space-y-3">
                          <div className="font-bold text-foreground">Grounded AI Analysis</div>
                          <div className="p-3 bg-[#111622]/60 border border-border/10 rounded-xl max-w-[90%] mr-auto text-muted-foreground space-y-1.5 font-sans leading-relaxed">
                            <p>JWT middleware initializes authentication inside:</p>
                            <div className="flex items-center gap-1.5 bg-[#0B0F19] p-1 border border-border/10 rounded text-[8px] text-primary font-mono">
                              <FileCode2 className="size-2.5" />
                              <span>apps/api/src/lib/auth.ts #L12-L34</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 8: Citation */}
                      {heroWalkSteps[heroWalkIdx].id === "citation" && (
                        <div className="space-y-3">
                          <div className="font-bold text-foreground">Referenced Code Citations</div>
                          <div className="p-3 bg-[#111622]/40 border border-border/10 rounded-lg space-y-2 font-mono text-[9px]">
                            <div className="text-[8px] text-muted-foreground uppercase font-bold">Checked Source Files</div>
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Check className="size-3 shrink-0" />
                              <span>auth.ts</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Check className="size-3 shrink-0" />
                              <span>middleware.ts</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Check className="size-3 shrink-0" />
                              <span>routes/user.ts</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* 2. HOW IT WORKS - 3 MINIMAL STEPS */}
      <section id="how-it-works" className="py-20 border-t border-border/10 bg-[#070A13]">
        <Container className="space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              How Revora Works
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Three simple steps to convert any codebase into engineering intelligence.
            </p>
          </div>

          <MinimalPipeline />
        </Container>
      </section>

      {/* 3. PLATFORM SYSTEM COMPONENT SPECIFICATIONS */}
      <section className="py-20 border-t border-border/10 bg-[#0B0F19]/20 relative">
        <Container className="space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Visual Platform Architectures
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Understand the core mechanics of Revora&apos;s search indexing, vector pipelines, and calls mappings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto select-none">
            {/* Visual 1: Semantic Search */}
            <div className="p-6 border border-border/10 bg-[#0B0F19]/45 rounded-xl space-y-4 text-center">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-primary">Semantic Similarity Search</h3>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed font-sans">
                Queries are converted into vectors to trace matches mathematically based on semantic proximity, rather than plain text matching.
              </p>
              <SemanticSearchVisualization />
            </div>

            {/* Visual 2: Knowledge Graph Nodes */}
            <div className="p-6 border border-border/10 bg-[#0B0F19]/45 rounded-xl space-y-4 text-center">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-primary">Interconnected Codebase Graphs</h3>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed font-sans">
                We trace file imports and function exports to map imports directly, keeping track of exact code references.
              </p>
              <KnowledgeGraphIllustration />
            </div>
          </div>
        </Container>
      </section>

      {/* 4. REAL AI CONVERSATION SIMULATION BLOCK */}
      <section className="py-20 border-t border-border/10 bg-[#070A13]">
        <Container className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Real Grounded Conversations
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Explore how the model cites sources, retrieves line ranges, and avoids hallucinations.
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-xl border border-border/15 bg-[#0F1420] overflow-hidden shadow-2xl">
            {/* Header bar */}
            <div className="px-4 py-3 bg-[#0A0D15] border-b border-border/10 flex items-center justify-between text-[9px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-foreground font-bold font-sans">Grounded Chat Simulator</span>
              </div>
              <span className="text-muted-foreground/60">Repository Context: apps/api</span>
            </div>

            <div className="p-5 space-y-4 font-mono text-[10px]">
              {/* User block */}
              <div className="flex gap-2 max-w-[85%] ml-auto flex-row-reverse text-right">
                <div className="size-5 rounded bg-primary/20 flex items-center justify-center text-primary text-[8px] font-bold uppercase">User</div>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-foreground font-sans">
                  Where is JWT authentication implemented?
                </div>
              </div>

              {/* Assistant block */}
              <div className="flex gap-2 max-w-[90%] mr-auto">
                <div className="size-5 rounded bg-secondary/20 flex items-center justify-center text-secondary text-[8px] font-bold uppercase shrink-0">AI</div>
                <div className="p-3.5 rounded-lg bg-[#111622]/60 border border-border/10 text-muted-foreground space-y-3 leading-relaxed text-left font-sans">
                  <p className="text-foreground">
                    JWT middleware initializes authentication inside the `createAuthMiddleware()` function, located in:
                  </p>
                  <div className="flex items-center gap-1.5 bg-[#0B0F19] p-1.5 border border-border/10 rounded text-[8px] text-primary font-mono">
                    <FileCode2 className="size-3 shrink-0" />
                    <span>apps/api/src/lib/auth.ts #L12-L34</span>
                  </div>
                  <p>
                    This is mounted globally in your index routers configuration to validate active authorization request headers.
                  </p>

                  {/* Referenced Files list */}
                  <div className="pt-2 border-t border-border/10 mt-1 font-mono text-[9px] space-y-1.5">
                    <div className="text-[8px] text-muted-foreground/60 uppercase font-bold tracking-wider">Traced Sources</div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="size-3 shrink-0" />
                      <span>auth.ts</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="size-3 shrink-0" />
                      <span>middleware.ts</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="size-3 shrink-0" />
                      <span>routes/user.ts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. WHY GROUNDED AI MATTERS */}
      <section className="py-20 border-t border-border/10 bg-[#0B0F19]/45">
        <Container className="space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Why Grounded AI Matters
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Standard LLM models do not understand local repository states. Revora solves context blindness with AST analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto select-none text-left">
            {/* Traditional LLMs */}
            <div className="p-6 border border-rose-500/10 bg-[#1A0E17]/20 rounded-xl space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="font-extrabold text-xs text-rose-400 font-mono tracking-wide uppercase flex items-center gap-1.5">
                <X className="size-4 shrink-0" />
                <span>Traditional LLM</span>
              </h3>
              <ul className="space-y-3 font-sans text-xs text-muted-foreground/80 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold shrink-0 mt-0.5">❌</span>
                  <span>Hallucinates folder paths, modules, and configurations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold shrink-0 mt-0.5">❌</span>
                  <span>Blind to local imports, call trees, and parameters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold shrink-0 mt-0.5">❌</span>
                  <span>Generates generic boilerplate code blocks unrelated to your system architecture.</span>
                </li>
              </ul>
            </div>

            {/* Revora Grounded */}
            <div className="p-6 border border-emerald-500/20 bg-[#0E1A16]/20 rounded-xl space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="font-extrabold text-xs text-emerald-400 font-mono tracking-wide uppercase flex items-center gap-1.5">
                <Check className="size-4 shrink-0" />
                <span>Revora Grounded AI</span>
              </h3>
              <ul className="space-y-3 font-sans text-xs text-foreground/90 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">✓</span>
                  <span>Parses files directly to fetch current line configurations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">✓</span>
                  <span>Traces actual function calls and dependency trees recursively.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">✓</span>
                  <span>Cites specific target source filenames on every query response.</span>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. INTERACTIVE PRODUCT PREVIEW SHOWCASE */}
      <section id="showcase" className="py-20 border-t border-border/10 bg-[#070A13] relative">
        <Container className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Interactive Product Showcase
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Explore the premium workspace screens designed to accelerate your repository analysis. Click tabs to switch.
            </p>
          </div>

          {/* Showcase Tabs selector */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-2xl mx-auto bg-[#111622]/40 p-1 border border-border/10 rounded-xl select-none">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "chat", label: "Grounded Chat" },
              { id: "architecture", label: "Architecture Graph" },
              { id: "health", label: "Health Dashboard" },
              { id: "explorer", label: "File Explorer" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveShowcase(tab.id as "dashboard" | "chat" | "architecture" | "health" | "explorer")}
                className={cn(
                  "px-3.5 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer select-none",
                  activeShowcase === tab.id
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/30"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Browser frame Mockup */}
          <div className="w-full max-w-4xl mx-auto rounded-xl border border-border/20 bg-[#0F1420]/80 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-sm">
            {/* Window control header */}
            <div className="flex items-center justify-between px-4 h-10 border-b border-border/10 bg-[#0A0D15] select-none text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-2 px-3 py-0.5 bg-[#111827] border border-border/10 rounded text-[9px] text-muted-foreground w-64 justify-center">
                <Search className="size-2.5" />
                <span>revora.ai/workspace/23614c3e</span>
              </div>
              <div className="flex items-center gap-1 bg-[#111827] px-2 py-0.5 border border-border/10 rounded">
                <GitBranch className="size-2.5 text-primary" />
                <span className="font-semibold text-foreground text-[8px] font-mono">main</span>
              </div>
            </div>

            {/* Showcase canvas body */}
            <div className="h-[400px] overflow-hidden relative bg-[#0B0F19]/40 text-xs">
              <AnimatePresence mode="wait">
                {activeShowcase === "dashboard" && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 space-y-4 h-full overflow-y-auto"
                  >
                    <div className="flex justify-between items-center border-b border-border/10 pb-3">
                      <span className="font-bold text-foreground">Repositories</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] uppercase font-bold rounded">Live Status</span>
                    </div>

                    <div className="space-y-2 text-left">
                      {[
                        { name: "revora-core-service", lang: "TypeScript", owner: "revora-ai", size: "128 KB", status: "COMPLETED" },
                        { name: "express-api-service", lang: "JavaScript", owner: "revora-ai", size: "84 KB", status: "COMPLETED" },
                        { name: "bullmq-worker-pipeline", lang: "TypeScript", owner: "revora-ai", size: "192 KB", status: "PROCESSING" }
                      ].map((item) => (
                        <div key={item.name} className="p-3 bg-[#111622]/40 border border-border/10 rounded-lg flex items-center justify-between font-mono text-[10px]">
                          <div className="flex items-center gap-2">
                            <Folder className="size-3.5 text-primary" />
                            <div>
                              <div className="font-semibold text-foreground">{item.name}</div>
                              <div className="text-[9px] text-muted-foreground">by {item.owner} • {item.size}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 bg-[#1E2538]/50 border border-border/10 text-muted-foreground text-[8px] rounded">{item.lang}</span>
                            <span className={cn(
                              "px-1.5 py-0.2 text-[8px] font-bold rounded",
                              item.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                            )}>
                              {item.status === "COMPLETED" ? "Ready" : "Syncing"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeShowcase === "chat" && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 flex flex-col justify-between h-full font-mono text-[10px]"
                  >
                    <div className="space-y-3.5 overflow-y-auto flex-1 pr-1.5 text-left">
                      {/* User message */}
                      <div className="flex gap-2 max-w-[80%] ml-auto flex-row-reverse text-right">
                        <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[8px] font-bold">U</div>
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-foreground font-sans">
                          Where does the Express app initialize the SSE stream router?
                        </div>
                      </div>

                      {/* Assistant message */}
                      <div className="flex gap-2 max-w-[85%] mr-auto">
                        <div className="size-5 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-[8px] font-bold shrink-0">R</div>
                        <div className="p-3.5 rounded-lg bg-[#111622]/60 border border-border/10 text-[#E2E8F0] space-y-2 leading-relaxed text-left font-sans">
                          <p>
                            Based on your codebase, the Server-Sent Events stream initialization is routed inside:
                          </p>
                          <div className="flex items-center gap-1.5 bg-[#0B0F19] p-1.5 border border-border/10 rounded text-[8px] font-semibold text-primary font-mono">
                            <FileCode2 className="size-3" />
                            <span>apps/api/src/routes/repository.routes.ts #L42</span>
                          </div>
                          <p>
                            It mounts the controller middleware directly on <code className="text-secondary font-bold font-mono">GET /progress/stream</code>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Input placeholder */}
                    <div className="relative mt-2 border-t border-border/10 pt-2 shrink-0">
                      <input
                        type="text"
                        disabled
                        placeholder="Ask grounding query..."
                        className="w-full bg-[#111827]/80 border border-border/10 rounded-lg px-3 py-2 text-[9px] text-muted-foreground font-sans"
                      />
                      <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-primary size-3.5" />
                    </div>
                  </motion.div>
                )}

                {activeShowcase === "architecture" && (
                  <motion.div
                    key="architecture"
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 flex flex-col justify-center items-center h-full select-none"
                  >
                    <div className="text-center mb-4 font-mono text-[9px] text-muted-foreground uppercase">
                      Codebase Dependency Tree Map
                    </div>
                    <KnowledgeGraphIllustration />
                  </motion.div>
                )}

                {activeShowcase === "health" && (
                  <motion.div
                    key="health"
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 h-full overflow-y-auto space-y-4 font-mono text-[10px]"
                  >
                    <span className="font-bold text-foreground block text-left">Workspace Health Auditor</span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { title: "Maintainability Grade", val: "A+", desc: "Excellent maintainability" },
                        { title: "Cognitive Complexity", val: "12", desc: "Low cognitive strain" },
                        { title: "Files Indexed", val: "120", desc: "100% active context" },
                        { title: "Lines of Code", val: "8,420", desc: "Prisma and Express core" }
                      ].map((item) => (
                        <div key={item.title} className="p-3 bg-[#111622]/40 border border-border/10 rounded-lg space-y-1 text-left">
                          <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">{item.title}</span>
                          <div className="text-base font-extrabold text-foreground">{item.val}</div>
                          <span className="text-[8px] text-muted-foreground/60 leading-tight">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeShowcase === "explorer" && (
                  <motion.div
                    key="explorer"
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 h-full overflow-y-auto text-left font-mono text-[10px] space-y-1.5 text-muted-foreground select-none"
                  >
                    <span className="font-bold text-foreground mb-2 block uppercase text-[8px] tracking-wider text-muted-foreground/60">Explorer view</span>

                    <div className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted/10 cursor-pointer">
                      <ChevronRight className="size-3 rotate-90" />
                      <Folder className="size-3.5 text-primary" />
                      <span className="text-foreground">apps</span>
                    </div>
                    <div className="pl-4 flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted/10 cursor-pointer">
                      <ChevronRight className="size-3 rotate-90" />
                      <Folder className="size-3.5 text-primary" />
                      <span className="text-foreground">api</span>
                    </div>
                    <div className="pl-8 flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted/10 cursor-pointer">
                      <ChevronRight className="size-3" />
                      <Folder className="size-3.5 text-primary" />
                      <span>controllers</span>
                    </div>
                    <div className="pl-8 flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted/10 cursor-pointer">
                      <ChevronRight className="size-3 rotate-90" />
                      <Folder className="size-3.5 text-primary" />
                      <span className="text-foreground font-semibold">services</span>
                    </div>
                    <div className="pl-12 flex items-center gap-1.5 px-1.5 py-0.5 bg-primary/5 text-primary border-l-2 border-primary rounded-r cursor-pointer">
                      <FileCode2 className="size-3.5" />
                      <span>sse.service.ts</span>
                    </div>
                    <div className="pl-12 flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted/10 cursor-pointer">
                      <FileCode2 className="size-3.5" />
                      <span>email.service.ts</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </section>

      {/* 7. FEATURES GRID WITH LIFT GROUP HOVER STATES */}
      <section id="features" className="py-20 border-t border-border/10 bg-[#0B0F19]/30 relative">
        <Container className="space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Supercharge codebase understanding.
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed font-sans">
              Accelerate developer onboarding, trace call stack interactions, map files, and search concepts instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {FEATURES.map((feat, index) => {
              const Icon = feat.icon
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="group"
                >
                  <Card
                    hoverEffect={false}
                    className="h-full flex flex-col items-start gap-4 p-8 select-none bg-[#0F1420]/40 backdrop-blur-md border border-border/10 transition-all duration-300 rounded-2xl text-left shadow-sm group-hover:-translate-y-1.5 group-hover:border-primary/40 group-hover:shadow-[0_4px_30px_rgba(59,130,246,0.06)]"
                  >
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="size-4.5" />
                    </div>
                    <div className="space-y-2 flex-1 w-full">
                      <h3 className="text-base font-bold text-foreground font-sans group-hover:text-primary transition-colors">{feat.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-sans">{feat.description}</p>
                      <div className="pt-2 w-full">
                        {renderMiniUI(feat.title)}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* 8. DETAILED COMPARISON: TRADITIONAL VS REVORA */}
      <section className="py-20 border-t border-border/10 bg-[#070A13]">
        <Container className="space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Compare Workflows
            </h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Contrast classical manual directory indexing patterns with Revora AST grounding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto select-none text-left">
            {/* Old Way */}
            <div className="p-6 border border-rose-500/10 bg-[#1A0E17]/25 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
              <h3 className="font-extrabold text-xs text-rose-400 font-mono tracking-wide uppercase flex items-center gap-1.5">
                <X className="size-4 shrink-0" />
                <span>Traditional Workflow</span>
              </h3>
              <ul className="space-y-3 font-sans text-xs text-muted-foreground/80 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Spend hours manually searching code folders.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Guess code paths based only on directory structures.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Perform simple string searches that miss tokens.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Read hundreds of files just to understand modules.</span>
                </li>
              </ul>
            </div>

            {/* Revora Way */}
            <div className="p-6 border border-emerald-500/20 bg-[#0E1A16]/25 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
              <h3 className="font-extrabold text-xs text-emerald-400 font-mono tracking-wide uppercase flex items-center gap-1.5">
                <Check className="size-4 shrink-0" />
                <span>Revora Workflow</span>
              </h3>
              <ul className="space-y-3 font-sans text-xs text-foreground/90 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Ask natural language questions about your repository.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Receive context-grounded, verified answers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Visualize exact imports, call paths, and structures.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">•</span>
                  <span>Generate code explanations and README docs.</span>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* 9. STATS METRICS (BELIEVABLE PLATFORM CAPABILITIES) */}
      <section className="py-16 border-t border-border/10 bg-[#0B0F19]/10">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center font-mono">
            {[
              { val: "100%", label: "Private Repo Support" },
              { val: "AST Aware", label: "Semantic Code Search" },
              { val: "Interactive", label: "Architecture Mapping" },
              { val: "Grounded", label: "AI Conversations" }
            ].map((stat) => (
              <div key={stat.label} className="space-y-1 border border-border/10 bg-[#111622]/20 p-4 rounded-xl">
                <div className="text-base font-extrabold text-primary">{stat.val}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 10. MODERN ENGINEERING INFRASTRUCTURE STACK BADGES */}
      <section className="py-16 border-t border-border/10 bg-[#070A13]">
        <Container className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60 font-bold">
              Built with Modern Engineering Infrastructure
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-muted-foreground/60 select-none max-w-4xl mx-auto">
            {[
              { name: "GitHub", icon: Github },
              { name: "TypeScript", icon: Cpu },
              { name: "React", icon: Globe },
              { name: "Node.js", icon: Terminal },
              { name: "Prisma", icon: Database },
              { name: "Redis", icon: RefreshCw },
              { name: "BullMQ", icon: Workflow },
              { name: "PostgreSQL", icon: Database },
              { name: "Docker", icon: Lock }
            ].map((tech) => {
              const Icon = tech.icon
              return (
                <div key={tech.name} className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-200">
                  <Icon className="size-3.5 text-primary/60 shrink-0" />
                  <span className="font-mono text-[10px] tracking-wide">{tech.name}</span>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* 11. THREE-CARD PREMIUM PRICING SECTION */}
      <section id="pricing" className="py-24 border-t border-border/10 bg-[#070A13]">
        <Container className="space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-sans">
              Start Free. Scale Later.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed font-sans">
              Revora is currently free during Early Access. Premium plans will introduce advanced engineering intelligence, collaboration tools, enterprise integrations, larger repository support, and higher AI limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* CARD 1: FREE (RECOMMENDED / CURRENT) */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border-2 border-primary/40 bg-[#0F1420]/80 backdrop-blur-md p-8 text-left flex flex-col justify-between relative shadow-2xl scale-[1.02] z-10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">Free</span>
                  <span className="px-2.5 py-0.5 bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold font-mono rounded-full uppercase">
                    Current Plan
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-extrabold text-foreground font-sans">$0</div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Perfect for individuals exploring AI-powered software engineering.
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-foreground/90 font-sans border-t border-border/15 pt-6">
                  {[
                    "Unlimited public repositories",
                    "AI Repository Analysis",
                    "Architecture Explorer",
                    "Dependency Mapping",
                    "Documentation Generation",
                    "Engineering Insights",
                    "GitHub Integration",
                    "Community Support"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="size-3.5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={getStartedHref}
                  className={cn(
                    buttonVariants({ size: "default" }),
                    "w-full bg-primary hover:bg-primary/95 text-white font-semibold h-11 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  )}
                >
                  <span>Start Free</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.div>

            {/* CARD 2: MONTHLY */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border border-border/15 bg-[#0F1420]/30 backdrop-blur-md p-8 text-left flex flex-col justify-between relative"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Monthly</span>
                  <span className="px-2.5 py-0.5 bg-muted/20 text-muted-foreground border border-border/20 text-[10px] font-medium font-mono rounded-full uppercase">
                    Coming Soon
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-muted-foreground font-mono">Pricing To Be Announced</div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed font-sans">
                    Designed for professional developers and growing teams.
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-muted-foreground/80 font-sans border-t border-border/15 pt-6">
                  {[
                    "Everything in Free",
                    "Unlimited Private Repositories",
                    "Advanced AI Engineering Intelligence",
                    "Team Collaboration",
                    "Workspace History",
                    "Faster Processing",
                    "API Access",
                    "Advanced Search",
                    "Repository Collections"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="size-3.5 text-muted-foreground/50 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button
                  disabled
                  className="w-full bg-muted/15 border border-border/20 text-muted-foreground/60 font-semibold h-11 rounded-xl cursor-not-allowed flex items-center justify-center text-xs"
                >
                  Coming Soon
                </button>
              </div>
            </motion.div>

            {/* CARD 3: QUARTERLY */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="rounded-3xl border border-border/15 bg-[#0F1420]/30 backdrop-blur-md p-8 text-left flex flex-col justify-between relative"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Quarterly</span>
                  <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-bold font-mono rounded-full uppercase">
                    Best Value
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-muted-foreground font-mono">Launching Soon</div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed font-sans">
                    Built for engineering teams and organizations.
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-muted-foreground/80 font-sans border-t border-border/15 pt-6">
                  {[
                    "Everything in Monthly",
                    "Enterprise Integrations",
                    "Large Repository Support",
                    "Organization Workspaces",
                    "SSO Authentication",
                    "Priority Support",
                    "Knowledge Graph",
                    "Unlimited AI Processing",
                    "Future AI Features"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="size-3.5 text-muted-foreground/50 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button
                  disabled
                  className="w-full bg-muted/15 border border-border/20 text-muted-foreground/60 font-semibold h-11 rounded-xl cursor-not-allowed flex items-center justify-center text-xs"
                >
                  Coming Soon
                </button>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* 12. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-20 border-t border-border/10 bg-[#0B0F19]/25">
        <Container className="space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Heading level="h2" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Questions</span>
            </Heading>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Find answers regarding indexing details, security standards, and support.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3.5 text-left">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="border border-border/10 bg-[#111622]/20 rounded-xl overflow-hidden transition-colors hover:bg-[#1E2538]/20"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left text-foreground font-semibold text-xs hover:text-primary transition-colors focus:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className="shrink-0 ml-4 p-1 rounded bg-[#161B2B] text-muted-foreground">
                      {isOpen ? <Minus className="size-3" /> : <Plus className="size-3" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="px-4 pb-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/10 mt-1 font-sans">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* 13. FINAL CTA SECTION (TRANSFORM YOUR REPOSITORY) */}
      <section className="py-20 border-t border-border/10 bg-[#0B0F19]/40 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <Container className="space-y-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Transform Your Repository Into Engineering Intelligence
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-sans">
            Connect your GitHub account and start mapping your codebase structures.
          </p>
          <div className="flex justify-center pt-2">
            <Link
              href={getStartedHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-2 h-11 px-6 rounded-lg cursor-pointer shadow-md"
              )}
            >
              <span>Start Building Free</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  )
}
