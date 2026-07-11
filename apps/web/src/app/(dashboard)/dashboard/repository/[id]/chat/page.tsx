"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  CheckCircle, 
  FileCode, 
  HelpCircle, 
  Folder, 
  FolderOpen, 
  File, 
  Search, 
  Copy, 
  Check, 
  Terminal, 
  ArrowRight, 
  Sparkles, 
  Code,
  History,
  Trash2,
  Edit2
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

interface Conversation {
  id: string
  title: string
  updatedAt: string
  createdAt: string
}

const SUGGESTED_CARDS = [
  { icon: "🏗", title: "Explain Architecture", text: "Explain repository architecture" },
  { icon: "🔐", title: "Explain Authentication", text: "Where is authentication handled?" },
  { icon: "🗂", title: "Repository Structure", text: "Explain database layer." },
  { icon: "⚡", title: "Entry Point", text: "Which files contain API endpoints?" },
  { icon: "📦", title: "Dependencies", text: "How is routing implemented?" },
]

const PROGRESSIVE_STEPS = [
  "🤖 Thinking...",
  "🔍 Searching repository chunks...",
  "📂 Retrieving relevant code context...",
  "✍️ Generating answer..."
]

function ProgressiveLoader() {
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, PROGRESSIVE_STEPS.length - 1))
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col gap-2 p-4 bg-[#111622]/40 border border-border/10 rounded-xl my-3 text-[11px] font-mono select-none">
      <div className="flex items-center gap-2 text-primary font-bold">
        <Loader2 className="size-3.5 animate-spin" />
        <span>{PROGRESSIVE_STEPS[step]}</span>
      </div>
      <div className="w-full bg-[#1A233C]/40 rounded-full h-1 overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-500" 
          style={{ width: `${((step + 1) / PROGRESSIVE_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: repositoryId } = React.use(params)

  // Layout Tabs on Mobile viewports: 'chat' | 'explorer' | 'code'
  const [activeTab, setActiveTab] = React.useState<"chat" | "explorer" | "code">("chat")

  const [repoDetails, setRepoDetails] = React.useState<RepositoryDetails | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [question, setQuestion] = React.useState("")
  const [isLoadingRepo, setIsLoadingRepo] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [abortController, setAbortController] = React.useState<AbortController | null>(null)

  // Conversation Memory State
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [conversationId, setConversationId] = React.useState<string | null>(null)
  const [showHistoryList, setShowHistoryList] = React.useState(false)
  const [isEditingConvoId, setIsEditingConvoId] = React.useState<string | null>(null)
  const [editingTitle, setEditingTitle] = React.useState("")

  // Floating Selection State
  const [selectionText, setSelectionText] = React.useState("")
  const [selectionRange, setSelectionRange] = React.useState<{ startLine: number; endLine: number } | null>(null)
  const [toolbarPos, setToolbarPos] = React.useState<{ x: number; y: number } | null>(null)

  // Explanation Side Panel State
  const [showExplainPanel, setShowExplainPanel] = React.useState(false)
  const [explainFilePath, setExplainFilePath] = React.useState("")
  const [explainSelectedText, setExplainSelectedText] = React.useState("")
  const [explainLines, setExplainLines] = React.useState<{ start: number; end: number }>({ start: 1, end: 1 })
  const [explainAnswer, setExplainAnswer] = React.useState("")
  const [isExplaining, setIsExplaining] = React.useState(false)
  const [explainFollowUp, setExplainFollowUp] = React.useState("")

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

  // Fetch recent conversations for this repo
  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; conversations: Conversation[] }>(
        `/v1/conversations?repositoryId=${repositoryId}`
      )
      if (res.success) {
        setConversations(res.conversations)
      }
    } catch (err: unknown) {
      const error = err as Error
      console.error("Failed to load conversations:", error.message)
    }
  }, [repositoryId])

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

        await fetchConversations()
      } catch (err: unknown) {
        const error = err as Error
        toast.error(error.message || "Failed to initialize workspace data.")
      } finally {
        setIsLoadingRepo(false)
      }
    }

    fetchRepoData()
  }, [repositoryId, router, fetchConversations])

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
    if (!text || (isSubmitting && !textToSend)) return

    if (isSubmitting) {
      if (abortController) {
        abortController.abort()
        setAbortController(null)
      }
      setIsSubmitting(false)
      return
    }

    if (!textToSend) {
      setQuestion("")
    }

    const controller = new AbortController()
    setAbortController(controller)

    const messageIndex = messages.length
    const userMessage: Message = {
      id: `msg-user-${messageIndex}`,
      role: "user",
      content: text,
    }

    const assistantMessageId = `msg-assistant-${messageIndex}`
    const thinkingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    }

    setMessages((prev) => [...prev, userMessage, thinkingMessage])
    setIsSubmitting(true)
    setActiveTab("chat")

    let accumulatedText = ""
    let hasReceivedToken = false

    try {
      await api.stream(
        "/v1/chat/stream",
        { repositoryId, question: text, conversationId },
        (chunk) => {
          const lines = chunk.split("\n")
          let currentEvent = ""

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith("event: ")) {
              currentEvent = trimmedLine.replace("event: ", "").trim()
            } else if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.replace("data: ", "").trim()
              if (dataStr === "[DONE]") {
                break
              }
              try {
                const parsed = JSON.parse(dataStr)
                if (currentEvent === "conversationId") {
                  setConversationId(parsed.conversationId)
                  fetchConversations()
                } else if (currentEvent === "sources") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, sources: parsed }
                        : msg
                    )
                  )
                } else if (currentEvent === "token") {
                  hasReceivedToken = true
                  accumulatedText += parsed.token
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  )
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        },
        controller.signal
      )
    } catch (err: unknown) {
      const error = err as Error
      if (error.name === "AbortError" || controller.signal.aborted) {
        toast.info("Generation cancelled.")
        if (!hasReceivedToken) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))
        }
      } else {
        toast.error(error.message || "A network or server error occurred.")
        if (!hasReceivedToken) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))
        }
      }
    } finally {
      setIsSubmitting(false)
      setAbortController(null)
    }
  }

  // Conversation Sidebar Actions
  const handleNewChat = () => {
    setConversationId(null)
    setMessages([])
    setShowHistoryList(false)
  }

  const handleSelectConvo = async (convoId: string) => {
    setConversationId(convoId)
    setMessages([])
    setShowHistoryList(false)
    setIsSubmitting(true)

    try {
      const res = await api.get<{ success: boolean; messages: { id: string; role: string; content: string; sources?: unknown }[] }>(
        `/v1/conversations/${convoId}/messages`
      )
      if (res.success) {
        const mapped = res.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          sources: m.sources ? JSON.parse(JSON.stringify(m.sources)) : undefined,
        }))
        setMessages(mapped)
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to load past conversation messages.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRenameConvo = async (convoId: string) => {
    if (!editingTitle.trim()) return
    try {
      const res = await api.patch<{ success: boolean }>(
        `/v1/conversations/${convoId}`,
        { title: editingTitle.trim() }
      )
      if (res.success) {
        toast.success("Conversation renamed.")
        fetchConversations()
        setIsEditingConvoId(null)
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to rename conversation.")
    }
  }

  const handleDeleteConvo = async (convoId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return
    try {
      const res = await api.delete<{ success: boolean }>(
        `/v1/conversations/${convoId}`
      )
      if (res.success) {
        toast.success("Conversation deleted.")
        fetchConversations()
        if (conversationId === convoId) {
          handleNewChat()
        }
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to delete conversation.")
    }
  }

  // Floating Selection actions mapping
  const handleCodeAreaMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setToolbarPos(null)
      return
    }
    const text = selection.toString().trim()
    if (!text) {
      setToolbarPos(null)
      return
    }

    const anchorNode = selection.anchorNode?.parentElement
    const focusNode = selection.focusNode?.parentElement
    const getLineNum = (el: HTMLElement | null): number => {
      if (!el) return 0
      const idAttr = el.closest('[id^="line-"]')?.id
      return idAttr ? parseInt(idAttr.replace("line-", ""), 10) : 0
    }
    const start = getLineNum(anchorNode as HTMLElement)
    const end = getLineNum(focusNode as HTMLElement)

    setSelectionText(text)
    setSelectionRange({
      startLine: Math.min(start, end) || 1,
      endLine: Math.max(start, end) || 1,
    })

    setToolbarPos({ x: e.clientX, y: e.clientY - 45 })
  }

  const handleTriggerAction = async (actionType: string) => {
    if (!selectedFilePath || !selectionText || !selectionRange) return
    setToolbarPos(null)

    setExplainFilePath(selectedFilePath)
    setExplainSelectedText(selectionText)
    setExplainLines({ start: selectionRange.startLine, end: selectionRange.endLine })
    setExplainAnswer("")
    setIsExplaining(true)
    setShowExplainPanel(true)

    try {
      const res = await api.post<{ success: boolean; answer: string }>("/explain-selection", {
        repositoryId,
        filePath: selectedFilePath,
        startLine: selectionRange.startLine,
        endLine: selectionRange.endLine,
        selectedCode: selectionText,
        type: actionType,
      })
      if (res.success) {
        setExplainAnswer(res.answer)
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to analyze selection.")
    } finally {
      setIsExplaining(false)
    }
  }

  const handleExplainFollowUp = async () => {
    if (!explainFollowUp.trim() || isExplaining) return
    const query = explainFollowUp.trim()
    setExplainFollowUp("")
    setIsExplaining(true)

    try {
      const res = await api.post<{ success: boolean; answer: string }>("/explain-selection", {
        repositoryId,
        filePath: explainFilePath,
        startLine: explainLines.start,
        endLine: explainLines.end,
        selectedCode: explainSelectedText,
        prompt: query,
      })
      if (res.success) {
        setExplainAnswer((prev) => prev + `\n\n💬 **Follow-up: ${query}**\n\n` + res.answer)
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Failed to parse follow-up query.")
    } finally {
      setIsExplaining(false)
    }
  }

  const handleOpenInChat = () => {
    const text = 
      `I have highlighted this code inside \`${explainFilePath}\` (lines ${explainLines.start}-${explainLines.end}):\n` +
      `\`\`\`\n${explainSelectedText}\n\`\`\`\n\n` +
      `Here was your review:\n\n${explainAnswer}`

    const userMsg: Message = {
      id: `msg-user-imported-${Date.now()}`,
      role: "user",
      content: `Show details of selection inside \`${explainFilePath}\``,
    }
    const assistantMsg: Message = {
      id: `msg-assistant-imported-${Date.now()}`,
      role: "assistant",
      content: text,
      sources: [{ filePath: explainFilePath, startLine: explainLines.start, endLine: explainLines.end, similarity: 1 }],
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setShowExplainPanel(false)
    setActiveTab("chat")
    toast.success("Selection review successfully imported into active chat thread.")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
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
      <div className="space-y-1.5 pl-2.5">
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
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer select-none border border-transparent ${
                  isSelected 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-[#1A233C]/20"
                }`}
              >
                {isDir ? (
                  isExpanded ? (
                    <FolderOpen className="size-3.5 shrink-0 text-primary" />
                  ) : (
                    <Folder className="size-3.5 shrink-0 text-primary/80" />
                  )
                ) : (
                  <File className="size-3.5 shrink-0 text-slate-400" />
                )}
                <span className="truncate">{node.name}</span>
              </div>
              {isDir && isExpanded && node.children && (
                <div className="border-l border-border/10 ml-2.5 pl-1.5">
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
      <div className="flex flex-col items-center justify-center flex-1 py-32 gap-3.5 bg-[#0B0F19]">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Loading repository workspace configuration...</p>
      </div>
    )
  }

  if (!repoDetails) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 gap-3.5 bg-[#0B0F19]">
        <HelpCircle className="size-8 text-rose-500" />
        <p className="text-sm text-muted-foreground font-mono">Failed to initialize repository chatspace.</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-57px)] w-full flex overflow-hidden text-foreground bg-[#0B0F19]">
      
      {/* COLUMN 1: LEFT SIDEBAR (File Tree Explorer) */}
      <aside className={`w-72 border-r border-border/20 bg-[#0A0D15] flex flex-col shrink-0 z-30 transition-transform duration-200 absolute inset-y-0 left-0 md:relative md:translate-x-0 ${
        activeTab === "explorer" ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-4 border-b border-border/10 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            <span className="text-xs uppercase font-extrabold tracking-wider font-mono text-muted-foreground">Workspace Tree</span>
          </div>
        </div>

        <div className="p-3 border-b border-border/10 select-none">
          <div className="relative bg-[#111622] border border-border/25 rounded-xl p-2 flex items-center gap-2 focus-within:border-primary/45 transition-colors">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search files..."
              className="bg-transparent border-none text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/35 flex-1 min-w-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pr-2 scrollbar-thin">
          {getFilteredNodes().length > 0 ? (
            renderTree(getFilteredNodes())
          ) : (
            <div className="text-center text-xs text-muted-foreground/30 font-mono py-12 select-none">
              No matching files
            </div>
          )}
        </div>
      </aside>

      {/* COLUMN 2: CENTER PANEL (Code Viewer - Independently scrollable) */}
      <main className={`flex-1 flex flex-row min-w-0 bg-[#080B12] transition-all duration-200 border-r border-border/20 ${
        activeTab === "code" ? "flex" : "hidden md:flex"
      }`}>
        {selectedFilePath ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <div className="px-4 py-3 bg-[#111622]/60 border-b border-border/15 flex items-center justify-between gap-4 select-none shrink-0 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                <FileCode className="size-4 text-primary" />
                {selectedFilePath.split("/").pop()}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/45 truncate max-w-xs">{selectedFilePath}</span>
                {fileContents[selectedFilePath] && (
                  <button
                    onClick={() => handleCopyCode(fileContents[selectedFilePath] || "")}
                    className="hover:text-foreground flex items-center gap-1 transition-all cursor-pointer font-mono"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div 
              className="flex-1 overflow-auto p-4 select-text"
              onMouseUp={handleCodeAreaMouseUp}
            >
              {isLoadingFile ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 font-mono text-xs text-muted-foreground">
                  <Loader2 className="size-6 text-primary animate-spin" />
                  <span>Fetching file content bytes...</span>
                </div>
              ) : fileContents[selectedFilePath] ? (
                <div className="flex font-mono text-[11px] text-[#E2E8F0] min-w-max select-text">
                  <div className="text-muted-foreground/30 text-right pr-4 border-r border-border/10 select-none min-w-8 font-mono">
                    {fileContents[selectedFilePath].split("\n").map((_, lineIdx) => (
                      <div key={lineIdx} className="min-h-6 flex items-center justify-end font-mono">
                        {lineIdx + 1}
                      </div>
                    ))}
                  </div>
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
                          className={`min-h-6 flex items-center font-mono text-[11px] pl-2 pr-4 transition-all duration-300 select-text ${
                            isHighlighted
                              ? "bg-amber-500/10 border-l-2 border-amber-400 text-amber-100 font-bold"
                              : "hover:bg-[#1A233C]/20"
                          }`}
                        >
                          {lineContent || <span className="opacity-0"> </span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground/30 font-mono py-24 select-none">
                  Empty File content
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none space-y-3 text-muted-foreground/40 font-mono">
            <Terminal className="size-12 text-muted-foreground/15" />
            <div className="text-xs font-bold text-foreground/40">No File Selected</div>
            <div className="text-[10px] max-w-xs leading-relaxed">
              Open any file from the repository sidebar or click an AI response citation to view content.
            </div>
          </div>
        )}

        {/* Floating Selection explanation side panel inside Code Viewer */}
        {showExplainPanel && (
          <div className="w-80 lg:w-[350px] border-l border-border/20 bg-[#0E1220] flex flex-col min-h-0 select-text shrink-0 shadow-2xl relative z-20">
            <div className="p-3.5 bg-[#161D30]/60 border-b border-border/15 flex items-center justify-between shrink-0 font-mono text-xs select-none">
              <span className="font-extrabold text-foreground tracking-wider uppercase">Selection Review</span>
              <button 
                onClick={() => setShowExplainPanel(false)} 
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin select-text">
              <div className="bg-[#0A0D14]/80 p-2.5 rounded-xl border border-border/10 select-text">
                <div className="font-mono text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1 select-none">
                  {explainFilePath.split("/").pop()} ({explainLines.start}-{explainLines.end})
                </div>
                <pre className="font-mono text-[9px] text-foreground/80 overflow-x-auto max-h-24 truncate whitespace-pre-wrap select-text">
                  {explainSelectedText}
                </pre>
              </div>

              <div className="text-xs leading-relaxed select-text">
                {isExplaining && !explainAnswer ? (
                  <div className="flex items-center gap-2 text-primary font-mono text-[10px] select-none py-12 justify-center">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Analyzing selection...</span>
                  </div>
                ) : (
                  <Markdown content={explainAnswer} />
                )}
              </div>
            </div>

            <div className="p-3 border-t border-border/10 bg-[#0F1424]/90 space-y-2 shrink-0 select-none">
              <div className="relative bg-[#111622] border border-border/25 rounded-xl p-1.5 flex items-end gap-2">
                <textarea
                  rows={1}
                  value={explainFollowUp}
                  onChange={(e) => setExplainFollowUp(e.target.value)}
                  placeholder="Ask follow-up..."
                  className="flex-1 bg-transparent border-none text-[10px] text-foreground focus:outline-none placeholder:text-muted-foreground/35 resize-none py-1.5 px-2 max-h-[100px] leading-relaxed font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleExplainFollowUp()
                    }
                  }}
                />
                <Button
                  onClick={handleExplainFollowUp}
                  disabled={isExplaining || !explainFollowUp.trim()}
                  className="bg-primary hover:bg-primary/95 text-white h-7 px-3 text-[10px] rounded-lg shrink-0 cursor-pointer"
                >
                  Ask
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(explainAnswer)
                    toast.success("Copied to clipboard.")
                  }}
                  disabled={!explainAnswer}
                  variant="outline"
                  className="h-7 text-[9px] font-mono hover:bg-[#1A233C]/20 border-border/15 shrink-0 cursor-pointer"
                >
                  Copy
                </Button>
                <Button
                  onClick={handleOpenInChat}
                  disabled={!explainAnswer}
                  className="h-7 text-[9px] font-mono bg-primary hover:bg-primary/95 shrink-0 cursor-pointer"
                >
                  Open in Chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* COLUMN 3: RIGHT PANEL (AI Assistant Chat - independently scrollable) */}
      <section className={`w-full md:w-[400px] xl:w-[450px] bg-[#0E1220] flex flex-col shrink-0 z-10 transition-all duration-200 border-l border-border/20 ${
        activeTab === "chat" ? "flex" : "hidden md:flex"
      }`}>
        
        {/* Repository Summary Card */}
        <div className="p-4 border-b border-border/10 bg-[#0A0D15]/40 select-none shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2.5">
            <Heading level="h3" className="text-xs font-extrabold font-mono text-muted-foreground truncate uppercase tracking-wider">
              {showHistoryList ? "History List" : "Grounded Assistant"}
            </Heading>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowHistoryList(!showHistoryList)}
                variant="ghost"
                className={`size-7 p-0 rounded-lg hover:bg-[#1A233C]/20 transition-all ${
                  showHistoryList ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
                title="Conversations History"
              >
                <History className="size-4.5" />
              </Button>
              <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-400/20 bg-emerald-400/5 py-0 px-2 font-mono">
                <CheckCircle className="size-2.5 mr-1" />
                <span>AI Ready</span>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground/80 bg-[#111622]/40 p-2.5 border border-border/10 rounded-xl">
            <div className="truncate">Files: {repoDetails.metrics?.filesCount || 0}</div>
            <div className="truncate">Branch: {repoDetails.defaultBranch || "main"}</div>
            <div className="truncate">Chunks: {repoDetails.chunksCount || 0}</div>
            <div className="truncate">Embeddings: {repoDetails.embeddingsCount || 0}</div>
          </div>
        </div>

        {/* Dynamic Sidebar history switch / Chat viewport */}
        {showHistoryList ? (
          /* Historical Conversations List */
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin select-none">
            <div className="flex items-center justify-between gap-2 mb-2 select-none">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-wider font-mono">Recent Conversations</span>
              <Button
                onClick={handleNewChat}
                variant="ghost"
                className="text-[10px] h-7 px-2 font-mono text-primary hover:bg-primary/5 shrink-0 cursor-pointer"
              >
                + New Chat
              </Button>
            </div>

            {conversations.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground/30 font-mono py-12 select-none">
                No past conversations
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((convo) => {
                  const isActive = convo.id === conversationId
                  const isEditing = convo.id === isEditingConvoId

                  return (
                    <div
                      key={convo.id}
                      className={`p-3 border rounded-xl transition-all duration-150 relative group ${
                        isActive 
                          ? "bg-primary/10 border-primary/20 text-foreground" 
                          : "bg-[#111622]/40 border-border/10 hover:border-primary/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="bg-[#0B0F19] border border-border/25 rounded px-2 py-1 text-xs text-foreground focus:outline-none flex-1 min-w-0 font-mono"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameConvo(convo.id)
                              if (e.key === "Escape") setIsEditingConvoId(null)
                            }}
                          />
                          <button
                            onClick={() => handleRenameConvo(convo.id)}
                            className="text-emerald-400 hover:text-emerald-300 font-mono text-[10px] cursor-pointer px-1 font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingConvoId(null)}
                            className="text-rose-400 hover:text-rose-300 font-mono text-[10px] cursor-pointer px-1 font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 pr-14 cursor-pointer" onClick={() => handleSelectConvo(convo.id)}>
                          <div className="text-xs font-bold font-mono truncate">{convo.title}</div>
                          <div className="text-[9px] opacity-40 font-mono">
                            Last active {new Date(convo.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setIsEditingConvoId(convo.id)
                              setEditingTitle(convo.title)
                            }}
                            className="p-1 hover:text-primary transition-colors text-muted-foreground/60 cursor-pointer"
                            title="Rename"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteConvo(convo.id)}
                            className="p-1 hover:text-rose-400 transition-colors text-muted-foreground/60 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Active Chat Conversation Feed (Independently scrollable) */
          <div className="flex-1 overflow-y-auto p-4 space-y-6 select-text scrollbar-thin">
            {messages.length === 0 ? (
              /* Empty State Layout */
              <div className="py-12 space-y-6 text-center select-none max-w-sm mx-auto">
                <div className="size-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse shadow-lg shadow-primary/5">
                  <Sparkles className="size-5.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">Interactive Repository Chat</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Ask natural language questions about files, architecture, modules, or configurations.
                  </p>
                </div>

                {/* Suggested Questions Grid Cards */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-wider font-mono block">Suggested Questions</span>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTED_CARDS.map((card, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(card.text)}
                        disabled={isSubmitting}
                        className="flex items-center justify-between text-left px-3.5 py-2.5 bg-[#111622]/40 border border-border/15 hover:border-primary/45 hover:bg-[#1A233C]/20 text-[11px] text-muted-foreground hover:text-foreground rounded-xl transition-all font-mono leading-snug cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>{card.icon}</span>
                          <span className="truncate">{card.title}</span>
                        </span>
                        <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Message lists rendering */
              <div className="space-y-6">
                {messages.map((message) => {
                  const isAssistant = message.role === "assistant"
                  const isThinking = isAssistant && message.content === ""

                  return (
                    <div key={message.id} className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
                      {isAssistant && (
                        <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                          <Sparkles className="size-3.5" />
                        </div>
                      )}
                      <div className="space-y-1.5 max-w-[88%] min-w-0">
                        <div className="text-[9px] text-muted-foreground/45 font-bold uppercase tracking-wider select-none font-mono">
                          {isAssistant ? "Assistant" : "User"}
                        </div>
                        <div className={`rounded-2xl p-4 text-[11px] leading-relaxed ${
                          isAssistant ? "bg-[#111622]/30 border border-border/10 text-foreground" : "bg-primary/10 border border-primary/20 text-foreground"
                        }`}>
                          {isThinking ? (
                            <ProgressiveLoader />
                          ) : isAssistant ? (
                            <div className="relative">
                              <Markdown content={message.content} />
                              {isSubmitting && message.id === messages[messages.length - 1]?.id && (
                                <span className="inline-block w-1 h-3.5 bg-primary/80 ml-1 animate-pulse" />
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed font-sans">{message.content}</p>
                          )}

                          {/* Citations cards display list */}
                          {isAssistant && !isThinking && message.sources && message.sources.length > 0 && (
                            <div className="mt-4 pt-3.5 border-t border-border/10 space-y-2 select-none">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-wider font-mono block">Citations Sources</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {message.sources.map((src, sIdx) => {
                                  const similarityPercentage = Math.round(src.similarity * 100)
                                  return (
                                    <div
                                      key={sIdx}
                                      onClick={() => handleOpenCitation(src)}
                                      className="bg-[#111622]/80 hover:bg-[#1E2538] border border-border/20 hover:border-primary/45 rounded-xl p-2.5 transition-all flex items-center justify-between gap-2 cursor-pointer font-mono text-[9px] text-muted-foreground hover:text-foreground"
                                    >
                                      <div className="min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-1 font-bold text-foreground">
                                          <FileCode className="size-3 text-primary shrink-0" />
                                          <span className="truncate">{src.filePath.split("/").pop()}</span>
                                        </div>
                                        <div>Lines {src.startLine}-{src.endLine}</div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="font-bold text-emerald-400 font-mono">{similarityPercentage}%</div>
                                        <div className="text-[8px] opacity-50">Match</div>
                                      </div>
                                    </div>
                                  )
                                })}
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
        )}

        {/* Sticky Chat Input Panel (Fixed-bottom) */}
        <div className="border-t border-border/10 bg-[#0F1424]/90 p-4 shrink-0 select-none">
          <div className="relative bg-[#111622]/90 border border-border/25 focus-within:border-primary/45 rounded-xl p-1.5 flex items-end gap-2 shadow-xl transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask workspace queries..."
              className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/35 resize-none py-2 px-3 min-h-[36px] max-h-[160px] leading-relaxed"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!isSubmitting && !question.trim()}
              className="bg-primary hover:bg-primary/95 text-white size-8.5 rounded-lg shrink-0 cursor-pointer p-0 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="size-3 bg-white rounded-xs animate-pulse" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <div className="text-center text-[9px] text-muted-foreground/35 mt-2 font-mono flex items-center justify-between px-1">
            <span>Enter to Send, Shift+Enter for newline</span>
            {conversationId && (
              <button onClick={handleNewChat} className="text-primary hover:underline cursor-pointer font-bold">
                + Clear Chat
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Floating Selection Toolbar */}
      {toolbarPos && (
        <div 
          className="fixed bg-[#111622]/95 border border-border/30 px-2 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xl z-50 backdrop-blur-md font-mono text-[9px] select-none"
          style={{ left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px`, transform: "translate(-50%, -100%)" }}
        >
          <button
            onClick={() => handleTriggerAction("Explain")}
            className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary hover:text-white rounded-lg cursor-pointer transition-all flex items-center gap-1 font-bold"
          >
            ✨ Explain
          </button>
          <button
            onClick={() => handleTriggerAction("Summarize")}
            className="px-2 py-1 hover:bg-[#1A233C]/20 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer transition-all flex items-center gap-1"
          >
            📝 Summarize
          </button>
          <button
            onClick={() => handleTriggerAction("Find Bugs")}
            className="px-2 py-1 hover:bg-[#1A233C]/20 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer transition-all flex items-center gap-1"
          >
            🐛 Find Bugs
          </button>
          <button
            onClick={() => handleTriggerAction("Optimize")}
            className="px-2 py-1 hover:bg-[#1A233C]/20 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer transition-all flex items-center gap-1"
          >
            ⚡ Optimize
          </button>
          <button
            onClick={() => handleTriggerAction("Security Review")}
            className="px-2 py-1 hover:bg-[#1A233C]/20 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer transition-all flex items-center gap-1"
          >
            🔐 Security
          </button>
        </div>
      )}

      {/* Floating responsive tab bar selector for mobile screen toggles */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#111622] border border-border/30 px-3 py-2 rounded-2xl flex items-center gap-4 z-40 md:hidden shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setActiveTab("explorer")}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono uppercase font-bold cursor-pointer ${activeTab === "explorer" ? "text-primary" : "text-muted-foreground"}`}
        >
          <Folder className="size-4.5" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono uppercase font-bold cursor-pointer ${activeTab === "chat" ? "text-primary" : "text-muted-foreground"}`}
        >
          <MessageSquare className="size-4.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono uppercase font-bold cursor-pointer ${activeTab === "code" ? "text-primary" : "text-muted-foreground"}`}
        >
          <Code className="size-4.5" />
          <span>Code</span>
        </button>
      </div>

    </div>
  )
}
