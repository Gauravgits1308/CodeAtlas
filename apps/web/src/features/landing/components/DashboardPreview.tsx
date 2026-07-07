"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  FileCode2,
  Folder,
  ChevronRight,
  Search,
  MessageSquare,
  Sparkles,
  GitBranch,
  FileText,
  Play,
} from "lucide-react"

export function DashboardPreview() {
  const [activeTab, setActiveTab] = React.useState<"chat" | "search" | "docs">("chat")
  const [inputText, setInputText] = React.useState("")
  const [messages] = React.useState([
    {
      role: "user",
      text: "How does the auth flow handle token expiration?",
    },
    {
      role: "assistant",
      text: "Based on `src/lib/auth.ts`, token expiration is managed via standard JWT claims. When a token expires, the client intercepts the 401 error and calls the `/api/auth/refresh` endpoint with the HttpOnly refresh token to obtain a new access token.",
    },
  ])

  const [searchQuery, setSearchQuery] = React.useState("auth flow")
  const [searchResults] = React.useState([
    {
      file: "src/lib/auth.ts",
      match: "98% match",
      desc: "Implements JWT token signing, verification, and rotation.",
      lang: "TypeScript",
    },
    {
      file: "src/middleware.ts",
      match: "89% match",
      desc: "Intercepts requests to verify sessions on protected API routes.",
      lang: "TypeScript",
    },
    {
      file: "src/app/api/auth/refresh/route.ts",
      match: "85% match",
      desc: "Rotates the short-lived access token using refresh cookies.",
      lang: "TypeScript",
    },
  ])

  return (
    <div className="w-full rounded-xl border border-border/60 bg-[#0F1420]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-sm max-w-5xl mx-auto">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border/40 bg-[#0B0F19]/90 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
          <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
          <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
        </div>

        {/* Center Path/Search indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#111827] border border-border/40 rounded-lg text-xs text-muted-foreground w-1/2 justify-center max-w-sm cursor-pointer hover:bg-muted/30 transition-colors">
          <Search className="size-3" />
          <span>Search or ask: token rotation...</span>
          <kbd className="ml-auto text-[10px] bg-card px-1.5 py-0.5 rounded border border-border/40 font-mono">⌘K</kbd>
        </div>

        {/* Branch Info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-[#111827] px-2.5 py-1 border border-border/40 rounded-lg">
          <GitBranch className="size-3 text-primary" />
          <span className="font-medium text-foreground">main</span>
        </div>
      </div>

      <div className="flex h-[450px] md:h-[500px]">
        {/* Left Sidebar */}
        <div className="hidden sm:flex flex-col w-52 border-r border-border/40 bg-[#0A0E17]/95 p-3 select-none text-xs">
          <div className="font-semibold text-muted-foreground/80 px-2 uppercase tracking-wider text-[10px] mb-3">
            Workspace
          </div>

          <div className="space-y-1 mb-6">
            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "chat"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <MessageSquare className="size-3.5" />
              <span>AI Chat Panel</span>
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "search"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Search className="size-3.5" />
              <span>Semantic Search</span>
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "docs"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <FileText className="size-3.5" />
              <span>AI Documentation</span>
            </button>
          </div>

          {/* Files Explorer Mock */}
          <div className="font-semibold text-muted-foreground/80 px-2 uppercase tracking-wider text-[10px] mb-2">
            Files explorer
          </div>
          <div className="space-y-0.5 font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/30 cursor-pointer">
              <ChevronRight className="size-3 rotate-90" />
              <Folder className="size-3.5 text-primary/70 fill-primary/10" />
              <span>src</span>
            </div>
            <div className="pl-4 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/30 cursor-pointer">
              <ChevronRight className="size-3" />
              <Folder className="size-3.5 text-primary/70 fill-primary/10" />
              <span>app</span>
            </div>
            <div className="pl-4 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/30 cursor-pointer">
              <ChevronRight className="size-3 rotate-90" />
              <Folder className="size-3.5 text-primary/70 fill-primary/10" />
              <span>lib</span>
            </div>
            <div className="pl-8 flex items-center gap-1.5 px-2 py-1 bg-[#111827]/60 text-foreground rounded border-l border-primary/50 cursor-pointer">
              <FileCode2 className="size-3.5 text-secondary" />
              <span>auth.ts</span>
            </div>
            <div className="pl-4 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/30 cursor-pointer">
              <ChevronRight className="size-3" />
              <Folder className="size-3.5 text-primary/70 fill-primary/10" />
              <span>components</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-[#0B0F19]/40 overflow-hidden">
          {/* Tab Selection (Mobile Only) */}
          <div className="flex sm:hidden border-b border-border/40 bg-[#0A0E17]/95 px-2 py-1.5 gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 text-center py-1 rounded text-xs font-medium ${
                activeTab === "chat" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 text-center py-1 rounded text-xs font-medium ${
                activeTab === "search" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`flex-1 text-center py-1 rounded text-xs font-medium ${
                activeTab === "docs" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              Docs
            </button>
          </div>

          {/* Render Active Panel */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {activeTab === "chat" && (
              <div className="flex flex-col h-full justify-between">
                {/* Chat Message List */}
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div
                        className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          msg.role === "user"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {msg.role === "user" ? "DEV" : <Sparkles className="size-3.5" />}
                      </div>
                      <div
                        className={`p-3 rounded-lg text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-secondary/15 border border-secondary/20 text-foreground"
                            : "bg-[#111827] border border-border/40 text-foreground/90 font-mono"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input block */}
                <div className="relative mt-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask CodeAtlas anything about code-atlas..."
                    className="w-full bg-[#111827] border border-border/60 rounded-xl px-4 py-3 pr-10 text-xs focus:outline-none focus:border-primary/70 transition-all font-mono"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-foreground p-1 rounded-md transition-colors">
                    <Play className="size-3 fill-primary" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border border-border/60 bg-[#111827] px-3 py-2 rounded-xl">
                  <Search className="size-4 text-primary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type to search semantically..."
                    className="bg-transparent border-none outline-none text-xs font-mono w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    Semantic matches
                  </div>
                  {searchResults.map((res, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-[#111827]/70 border border-border/40 rounded-xl hover:border-primary/40 cursor-pointer transition-all flex items-start justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground">
                          <FileCode2 className="size-3.5 text-primary" />
                          <span>{res.file}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{res.desc}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-secondary bg-secondary/10 border border-secondary/20 rounded px-1.5 py-0.5">
                        {res.match}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "docs" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border/40 pb-3">
                  <FileText className="size-5 text-secondary" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground font-mono">src/lib/auth.ts</h4>
                    <p className="text-[10px] text-muted-foreground">Generated via CodeAtlas AI v1.1</p>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
                  <p>
                    <span className="text-foreground font-semibold">Overview:</span> This module orchestrates session authorization using JWT tokens and secures routes against unauthorized requests.
                  </p>
                  <div className="bg-[#0B0F19]/60 border border-border/40 p-2.5 rounded-lg">
                    <div className="text-[10px] text-primary font-semibold uppercase mb-1">Exported Hooks & functions</div>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><code className="text-foreground font-bold">signAccessToken(payload: UserClaims)</code>: Generates a short-lived (15m) access token</li>
                      <li><code className="text-foreground font-bold">verifyToken(token: string)</code>: Validates claims and structures</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
