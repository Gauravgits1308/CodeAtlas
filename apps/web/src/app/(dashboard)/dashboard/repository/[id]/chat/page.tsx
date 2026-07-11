"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  Send, 
  Loader2, 
  MessageSquare, 
  CheckCircle, 
  FileCode, 
  HelpCircle, 
  ExternalLink,
  Folder,
  FolderOpen,
  File,
  Search,
  Copy,
  Check,
  Terminal
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api-client"
import { Heading } from "@/components/common/Heading"
import { Badge } from "@/components/common/Badge"
import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/Markdown"
import { RepositoryDetails } from "@/features/dashboard/types"

interface DBRepository {
  id: string
  name: string
  owner: string
  cloneUrl: string
  htmlUrl: string
  visibility: string
  status: string
  updatedAt: string
  createdAt: string
  lastSyncedAt?: string
  primaryLanguage: string | null
  stars: number
  forks: number
  watchers: number
  defaultBranch: string
  chunksCount: number
  embeddingsCount: number
  classifications?: {
    SOURCE_CODE: number
    MARKUP: number
    STYLESHEET: number
    CONFIGURATION: number
    DOCUMENTATION: number
  }
  metrics?: {
    linesCount: number
    filesCount: number
    languages: { name: string; percentage: number }[]
    complexityScore?: number
    dependencyCount?: number
  }
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { filePath: string; startLine: number; endLine: number; similarity: number }[]
}

interface FileTreeNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileTreeNode[]
}

const SUGGESTED_QUESTIONS = [
  "Explain repository architecture",
  "Where is authentication handled?",
  "How is routing implemented?",
  "Explain database layer.",
  "Which files contain API endpoints?",
]

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: repositoryId } = React.use(params)

  // Layout Tabs: 'chat' | 'explorer' | 'code'
  const [activeTab, setActiveTab] = React.useState<"chat" | "explorer" | "code">("chat")

  const [repoDetails, setRepoDetails] = React.useState<RepositoryDetails | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [question, setQuestion] = React.useState("")
  const [isLoadingRepo, setIsLoadingRepo] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Explorer State
  const [filesTree, setFilesTree] = React.useState<FileTreeNode[]>([])
  const [searchFilter, setSearchFilter] = React.useState("")
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({})

  // Viewer State
  const [selectedFilePath, setSelectedFilePath] = React.useState<string | null>(null)
  const [fileContents, setFileContents] = React.useState<Record<string, string>>({})
  const [isLoadingFile, setIsLoadingFile] = React.useState(false)
  const [highlightedLines, setHighlightedLines] = React.useState<{ start: number; end: number } | null>(null)
  const [copiedCode, setCopiedCode] = React.useState(false)

  const chatEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Fetch repository metadata and file tree list
  React.useEffect(() => {
    const fetchRepoData = async () => {
      try {
        const repoRes = await api.get<{ success: boolean; repositories: DBRepository[] }>("/v1/repositories")
        if (repoRes.success && Array.isArray(repoRes.repositories)) {
          const match = repoRes.repositories.find((r) => r.id === repositoryId)
          if (!match) {
            toast.error("Repository not found in connected projects list.")
            router.push("/dashboard")
            return
          }

          if (match.status !== "COMPLETED") {
            toast.error("Repository is not fully indexed yet. Please trigger sync.")
            router.push("/dashboard")
            return
          }

          setRepoDetails({
            id: match.id,
            name: match.name,
            owner: match.owner,
            url: match.htmlUrl || match.cloneUrl,
            provider: "github",
            isPrivate: match.visibility === "private",
            status: match.status,
            lastSyncedAt: match.lastSyncedAt,
            createdAt: match.createdAt,
            primaryLanguage: match.primaryLanguage,
            stars: match.stars,
            forks: match.forks,
            watchers: match.watchers,
            defaultBranch: match.defaultBranch,
            chunksCount: match.chunksCount,
            embeddingsCount: match.embeddingsCount,
            classifications: match.classifications,
            metrics: match.metrics || undefined,
          })
        }

        // Fetch file tree list
        const filesRes = await api.get<{ success: boolean; files: FileTreeNode[] }>(`/v1/repositories/${repositoryId}/files`)
        if (filesRes.success) {
          setFilesTree(filesRes.files)
        }
      } catch (err: unknown) {
        const error = err as Error
        toast.error(error.message || "Failed to initialize workspace data.")
      } finally {
        setIsLoadingRepo(false)
      }
    }

    fetchRepoData()
  }, [repositoryId, router])

  // Scroll to chat bottom on new messages
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-grow textarea input height dynamically
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [question])

  // Clickable citation trigger scrolling and highlights inside Viewer
  const handleOpenCitation = async (source: { filePath: string; startLine: number; endLine: number }) => {
    setSelectedFilePath(source.filePath)
    setHighlightedLines({ start: source.startLine, end: source.endLine })
    
    // Auto toggle tab layout to code viewer on small devices
    setActiveTab("code")

    let content = fileContents[source.filePath]
    if (!content) {
      setIsLoadingFile(true)
      try {
        const res = await api.get<{ success: boolean; content: string }>(
          `/v1/repositories/${repositoryId}/file?path=${encodeURIComponent(source.filePath)}`
        )
        if (res.success) {
          setFileContents((prev) => ({ ...prev, [source.filePath]: res.content }))
          content = res.content
        }
      } catch (err: unknown) {
        const error = err as Error
        toast.error(error.message || "Failed to load file contents.")
      } finally {
        setIsLoadingFile(false)
      }
    }

    // Scroll to starting line
    setTimeout(() => {
      const lineElement = document.getElementById(`line-${source.startLine}`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 200)
  }

  // Load standard file select from Tree Sidebar
  const handleSelectFile = async (filePath: string) => {
    setSelectedFilePath(filePath)
    setHighlightedLines(null)
    setActiveTab("code")

    if (fileContents[filePath]) return

    setIsLoadingFile(true)
    try {
      const res = await api.get<{ success: boolean; content: string }>(
        `/v1/repositories/${repositoryId}/file?path=${encodeURIComponent(filePath)}`
      )
      if (res.success) {
        setFileContents((prev) => ({ ...prev, [filePath]: res.content }))
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to load file contents.")
    } finally {
      setIsLoadingFile(false)
    }
  }

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || question).trim()
    if (!text || isSubmitting) return

    if (!textToSend) {
      setQuestion("")
    }

    const messageIndex = messages.length
    const userMessage: Message = {
      id: `msg-user-${messageIndex}`,
      role: "user",
      content: text,
    }

    const thinkingMessageId = `msg-assistant-${messageIndex}`
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      role: "assistant",
      content: "Thinking...",
    }

    setMessages((prev) => [...prev, userMessage, thinkingMessage])
    setIsSubmitting(true)

    // Scroll chat into view tab
    setActiveTab("chat")

    try {
      const response = await api.post<{
        success: boolean
        answer: string
        sources: { filePath: string; startLine: number; endLine: number; similarity: number }[]
      }>("/v1/chat", {
        repositoryId,
        question: text,
      })

      if (response.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === thinkingMessageId
              ? {
                  id: thinkingMessageId,
                  role: "assistant",
                  content: response.answer,
                  sources: response.sources,
                }
              : msg
          )
        )
      } else {
        toast.error("Failed to generate response.")
        setMessages((prev) => prev.filter((m) => m.id !== thinkingMessageId))
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "A network or server error occurred.")
      setMessages((prev) => prev.filter((m) => m.id !== thinkingMessageId))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  // Filter tree nodes recursively
  const getFilteredNodes = () => {
    if (!searchFilter.trim()) return filesTree
    const q = searchFilter.toLowerCase()

    const filterNode = (node: FileTreeNode): FileTreeNode | null => {
      if (node.type === "file") {
        return node.name.toLowerCase().includes(q) ? node : null
      }
      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((c): c is FileTreeNode => c !== null)

        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren }
        }
      }
      return node.name.toLowerCase().includes(q) ? { ...node, children: [] } : null
    }

    return filesTree.map(filterNode).filter((n): n is FileTreeNode => n !== null)
  }

  // Recursive tree render helper
  const renderTree = (nodes: FileTreeNode[]) => {
    return (
      <div className="space-y-1.5 pl-3">
        {nodes.map((node) => {
          const isDir = node.type === "directory"
          const isExpanded = expandedFolders[node.path]
          const isSelected = selectedFilePath === node.path

          return (
            <div key={node.path} className="space-y-1">
              <div
                onClick={() => {
                  if (isDir) {
                    toggleFolder(node.path)
                  } else {
                    handleSelectFile(node.path)
                  }
                }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer select-none ${
                  isSelected 
                    ? "bg-primary/15 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-[#1A233C]/20 border border-transparent"
                }`}
              >
                {isDir ? (
                  isExpanded ? (
                    <FolderOpen className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Folder className="size-4 shrink-0 text-primary/80" />
                  )
                ) : (
                  <File className="size-4 shrink-0 text-slate-400" />
                )}
                <span className="truncate">{node.name}</span>
              </div>
              {isDir && isExpanded && node.children && (
                <div className="border-l border-border/15 ml-3 pl-1">
                  {renderTree(node.children)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoadingRepo) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 gap-3.5">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading workspace files & configuration...</p>
      </div>
    )
  }

  if (!repoDetails) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 gap-3.5">
        <HelpCircle className="size-8 text-rose-500" />
        <p className="text-sm text-muted-foreground">Failed to initialize repository chatspace.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0F19]">
      {/* 1. Header Banner */}
      <div className="border-b border-border/20 bg-[#0F1424]/40 py-3.5 px-4 select-none shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/dashboard"
              className="p-1 hover:bg-[#1E2538] text-muted-foreground hover:text-foreground rounded-lg transition-all"
            >
              <ChevronLeft className="size-4.5" />
            </Link>
            <Heading level="h2" className="text-base font-bold truncate">
              {repoDetails.name}
            </Heading>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 py-0 px-2 flex items-center gap-1 font-mono">
              <CheckCircle className="size-3" />
              <span>AI Ready</span>
            </Badge>
          </div>

          {/* Responsive Header Tabs for mobile view toggles */}
          <div className="flex items-center bg-[#111622] border border-border/20 p-0.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider md:hidden">
            <button
              onClick={() => setActiveTab("explorer")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "explorer" ? "bg-[#1A233C] text-foreground" : "text-muted-foreground"}`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "chat" ? "bg-[#1A233C] text-foreground" : "text-muted-foreground"}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "code" ? "bg-[#1A233C] text-foreground" : "text-muted-foreground"}`}
            >
              Code
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>Files: {repoDetails.metrics?.filesCount || 0}</span>
            <span>Chunks: {repoDetails.chunksCount || 0}</span>
            <a
              href={repoDetails.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="size-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Layout Grid */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Left Panel: Sidebar Repository tree explorer */}
        <div className={`absolute inset-y-0 left-0 z-30 w-64 border-r border-border/20 bg-[#0A0D15] flex flex-col shrink-0 transition-transform duration-200 md:relative md:translate-x-0 ${
          activeTab === "explorer" ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="p-3 border-b border-border/10">
            <div className="relative bg-[#111622] border border-border/20 rounded-lg p-1.5 flex items-center gap-2 focus-within:border-primary/40">
              <Search className="size-4 text-muted-foreground shrink-0 pl-1" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search files..."
                className="bg-transparent border-none text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/45 flex-1 min-w-0"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 pr-2 scrollbar-thin">
            {getFilteredNodes().length > 0 ? (
              renderTree(getFilteredNodes())
            ) : (
              <div className="text-center text-xs text-muted-foreground/40 font-mono py-12">
                No matching files found
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Assistant Chat window */}
        <div className={`flex-1 flex flex-col min-h-0 bg-[#0B0F19] ${
          activeTab === "chat" ? "flex" : "hidden md:flex border-r border-border/20"
        }`}>
          <div className="flex-1 overflow-y-auto py-6 select-text">
            <div className="max-w-2xl mx-auto px-4 space-y-6">
              {messages.length === 0 ? (
                /* Suggested Questions Layout */
                <div className="py-16 space-y-6 text-center select-none max-w-md mx-auto">
                  <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
                    <MessageSquare className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">Codebase Assistant</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ask natural language questions about patterns or configurations. The assistant will answer grounded in indexed code.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        disabled={isSubmitting}
                        className="w-full text-left px-4 py-2.5 bg-[#111622]/40 border border-border/15 hover:border-primary/45 hover:bg-[#1A233C]/20 text-xs text-muted-foreground hover:text-foreground rounded-lg transition-all font-mono cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message list rendering */
                <div className="space-y-6">
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant"
                    const isThinking = isAssistant && message.content === "Thinking..."

                    return (
                      <div key={message.id} className={`flex gap-3.5 ${isAssistant ? "justify-start" : "justify-end"}`}>
                        {isAssistant && (
                          <div className="size-7.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 font-mono">
                            AI
                          </div>
                        )}
                        <div className="space-y-1.5 max-w-[85%] min-w-0">
                          <div className={`rounded-xl p-4 text-xs leading-relaxed ${
                            isAssistant ? "bg-[#111622]/40 border border-border/10 text-foreground" : "bg-primary/10 border border-primary/20 text-foreground"
                          }`}>
                            {isThinking ? (
                              <div className="flex items-center gap-2 text-muted-foreground font-mono">
                                <Loader2 className="size-3.5 animate-spin text-primary" />
                                <span>Thinking...</span>
                              </div>
                            ) : isAssistant ? (
                              <Markdown content={message.content} />
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            )}

                            {/* Citations Buttons */}
                            {isAssistant && !isThinking && message.sources && message.sources.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-border/10 space-y-2">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono block">Citations Sources</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {message.sources.map((src, sIdx) => (
                                    <button
                                      key={sIdx}
                                      onClick={() => handleOpenCitation(src)}
                                      className="bg-[#111622] hover:bg-[#1E2538] border border-border/25 text-[9px] text-muted-foreground hover:text-foreground px-2 py-1 rounded font-mono flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <FileCode className="size-3 text-primary" />
                                      <span>{src.filePath.split("/").pop()} ({src.startLine}-{src.endLine})</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom input area */}
          <div className="border-t border-border/10 bg-[#0F1424]/40 py-3.5 px-4 shrink-0 select-none">
            <div className="max-w-2xl mx-auto relative bg-[#111622]/80 border border-border/20 focus-within:border-primary/45 rounded-xl p-1.5 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                placeholder="Ask codebase queries..."
                className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/35 resize-none py-2 px-3 min-h-[36px] max-h-[160px] leading-relaxed"
              />
              <Button
                onClick={() => handleSend()}
                disabled={isSubmitting || !question.trim()}
                className="bg-primary hover:bg-primary/95 text-white size-8.5 rounded-lg shrink-0 cursor-pointer p-0"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel: Selected File Code Viewer */}
        <div className={`flex-1 flex-col min-h-0 bg-[#080B12] ${
          activeTab === "code" ? "flex" : "hidden md:flex md:w-1/2 lg:w-1/3 xl:w-2/5"
        }`}>
          {selectedFilePath ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Sticky File Header */}
              <div className="px-4 py-2.5 bg-[#111622]/70 border-b border-border/20 flex items-center justify-between gap-4 select-none shrink-0 font-mono text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-foreground tracking-tight">
                  <FileCode className="size-4 text-primary" />
                  {selectedFilePath.split("/").pop()}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/45 truncate max-w-xs">{selectedFilePath}</span>
                  {fileContents[selectedFilePath] && (
                    <button
                      onClick={() => handleCopyCode(fileContents[selectedFilePath] || "")}
                      className="hover:text-foreground flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Code Body */}
              <div className="flex-1 overflow-auto p-4 select-text">
                {isLoadingFile ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Loader2 className="size-6 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground font-mono">Loading contents...</span>
                  </div>
                ) : fileContents[selectedFilePath] ? (
                  <div className="flex font-mono text-xs text-[#E2E8F0] min-w-max select-text">
                    {/* Line numbers column */}
                    <div className="text-muted-foreground/30 text-right pr-4 border-r border-border/10 select-none min-w-8 font-mono">
                      {fileContents[selectedFilePath].split("\n").map((_, lineIdx) => (
                        <div key={lineIdx} className="min-h-6 flex items-center justify-end font-mono">
                          {lineIdx + 1}
                        </div>
                      ))}
                    </div>
                    {/* Code lines column */}
                    <div className="flex-1 pl-4 font-mono select-text">
                      {fileContents[selectedFilePath].split("\n").map((lineContent, lineIdx) => {
                        const lineNumber = lineIdx + 1
                        const isHighlighted =
                          highlightedLines &&
                          lineNumber >= highlightedLines.start &&
                          lineNumber <= highlightedLines.end

                        return (
                          <div
                            key={lineIdx}
                            id={`line-${lineNumber}`}
                            className={`min-h-6 flex items-center font-mono text-xs pl-2 pr-4 transition-all duration-300 select-text ${
                              isHighlighted
                                ? "bg-amber-500/10 border-l-2 border-amber-400 text-amber-100 font-bold"
                                : "hover:bg-[#1A233C]/25"
                            }`}
                          >
                            {lineContent || <span className="opacity-0"> </span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-muted-foreground/45 font-mono py-24 select-none">
                    Empty file content
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none space-y-2 text-muted-foreground/40 font-mono">
              <Terminal className="size-10 text-muted-foreground/20" />
              <div className="text-xs font-bold text-foreground/45">No File Selected</div>
              <div className="text-[10px]">Select a file from the explorer sidebar or click a citation to inspect contents.</div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
