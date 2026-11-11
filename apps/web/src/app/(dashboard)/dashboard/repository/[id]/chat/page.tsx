"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Loader2,
  XCircle,
  FileCode,
  Folder,
  FolderOpen,
  Search,
  Copy,
  Sparkles,
  Trash2,
  Edit2,
  Pin,
  ChevronLeft,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  RotateCcw,
  Download,
  Copy as CopyIcon
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Heading } from "@/components/common/Heading";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/Markdown";
import { RepositoryDetails } from "@/features/dashboard/types";
import { useRepositoryHealth } from "@/hooks/useRepositoryHealth";
import { cn } from "@/lib/utils";
import { ArchitectureGraph } from "@/features/architecture-graph/components/ArchitectureGraph";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { filePath: string; startLine: number; endLine: number; similarity: number }[];
}

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

interface HealthCategory {
  score: number;
  explanation: string;
}

interface HealthReport {
  categories: {
    architecture: HealthCategory;
    maintainability: HealthCategory;
    readability: HealthCategory;
    security: HealthCategory;
    performance: HealthCategory;
    documentation: HealthCategory;
    testing: HealthCategory;
    scalability: HealthCategory;
  };
  overallScore: number;
  maturity: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  quickWins: string[];
  longTermImprovements: string[];
  topRecommendations: string[];
  rawMarkdown: string;
}

interface ChatTab {
  id: string;
  title: string;
  type: "overview" | "chat" | "file" | "health" | "docs" | "diagram";
  filePath?: string;
  isPinned?: boolean;
}

const PROGRESSIVE_STEPS = [
  "🤖 Thinking...",
  "🔍 Searching repository chunks...",
  "📂 Retrieving relevant code context...",
  "✍️ Generating answer..."
];

function ProgressiveLoader() {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, PROGRESSIVE_STEPS.length - 1));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

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
  );
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const _router = useRouter();
  const searchParams = useSearchParams();
  const { id: repositoryId } = React.use(params);

  // Layout Panels Width States (resizable sidebars)
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  const [leftWidth, setLeftWidth] = React.useState(240);
  const [rightWidth, setRightWidth] = React.useState(260);

  const [activeLeftTab, setActiveLeftTab] = React.useState<"explorer" | "chats">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("revora_active_left_tab");
      if (saved === "explorer" || saved === "chats") return saved;
    }
    return "explorer";
  });

  const handleLeftTabChange = React.useCallback((tab: "explorer" | "chats") => {
    setActiveLeftTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("revora_active_left_tab", tab);
    }
  }, []);

  // Center Canvas views state
  const [centerView, setCenterView] = React.useState<"overview" | "chat" | "code" | "health" | "docs" | "diagram">("overview");

  // VS Code style tab list state
  const [tabs, setTabs] = React.useState<ChatTab[]>([
    { id: "overview-active", title: "Overview", type: "overview", isPinned: true },
    { id: "chat-active", title: "AI Chat Assistant", type: "chat" },
  ]);
  const [activeTabId, setActiveTabId] = React.useState("overview-active");

  const [repoDetails, setRepoDetails] = React.useState<RepositoryDetails | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [question, setQuestion] = React.useState("");
  const [isLoadingRepo, setIsLoadingRepo] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [abortController, setAbortController] = React.useState<AbortController | null>(null);

  // Conversation Memory State
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [isEditingConvoId, setIsEditingConvoId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");

  // Floating Selection State (prefixed with _ for linter)
  const [_selectionText, _setSelectionText] = React.useState("");
  const [_selectionRange, _setSelectionRange] = React.useState<{ startLine: number; endLine: number } | null>(null);
  const [_toolbarPos, _setToolbarPos] = React.useState<{ x: number; y: number } | null>(null);

  // Explanation Side Panel State (prefixed with _ for linter)
  const [_showExplainPanel, _setShowExplainPanel] = React.useState(false);
  const [_explainFilePath, _setExplainFilePath] = React.useState("");
  const [_explainSelectedText, _setExplainSelectedText] = React.useState("");
  const [_explainLines, _setExplainLines] = React.useState<{ start: number; end: number }>({ start: 1, end: 1 });
  const [_explainAnswer, _setExplainAnswer] = React.useState("");
  const [_isExplaining, _setIsExplaining] = React.useState(false);
  const [_explainFollowUp, _setExplainFollowUp] = React.useState("");
  const [_explainMode, _setExplainMode] = React.useState<"EXPLAIN" | "SUMMARIZE" | "BUG_REVIEW" | "OPTIMIZE" | "SECURITY">("EXPLAIN");

  // Health Dashboard State
  const [healthReport, setHealthReport] = React.useState<HealthReport | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = React.useState(false);

  // Explorer State
  const [filesTree, setFilesTree] = React.useState<FileTreeNode[]>([]);
  const [searchFilter, setSearchFilter] = React.useState("");
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({});

  // Viewer State
  const [selectedFilePath, setSelectedFilePath] = React.useState<string | null>(null);
  const [fileContents, setFileContents] = React.useState<Record<string, string>>({});
  const [isLoadingFile, setIsLoadingFile] = React.useState(false);
  const [_highlightedLines, _setHighlightedLines] = React.useState<{ start: number; end: number } | null>(null);
  const [_copiedCode, _setCopiedCode] = React.useState(false);

  // AI Documentation Generator States
  const [docType, setDocType] = React.useState<"README" | "API_DOCS" | "FOLDER_STRUCTURE" | "SETUP_GUIDE">("README");
  const [docTone, setDocTone] = React.useState<"PROFESSIONAL" | "BEGINNER" | "ENTERPRISE">("PROFESSIONAL");
  const [docContent, setDocContent] = React.useState("");
  const [isGeneratingDocs, setIsGeneratingDocs] = React.useState(false);

  // AI Architecture Diagram States
  const [_diagramView, _setDiagramView] = React.useState<"FOLDER_STRUCTURE" | "DEPENDENCY_GRAPH" | "SERVICE_GRAPH" | "API_FLOW" | "DATABASE_FLOW">("FOLDER_STRUCTURE");
  const [mermaidCode, setMermaidCode] = React.useState("");
  const [isGeneratingDiagram, setIsGeneratingDiagram] = React.useState(false);
  const [_zoomScale, _setZoomScale] = React.useState(1.0);
  const [_panPosition, _setPanPosition] = React.useState({ x: 0, y: 0 });

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  // Check tab search param on mount
  React.useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "chat") {
      const timer = setTimeout(() => {
        setCenterView("chat");
        setActiveTabId("chat-active");
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Scroll to bottom helper
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Detect when user intentionally scrolls up
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const offset = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = offset < 150;
    setShouldAutoScroll(isAtBottom);
  };

  // Dynamic Health Grade calculations
  const healthDetails = useRepositoryHealth(repoDetails?.metrics?.complexityScore);

  const isAnalysisAvailable = React.useMemo(() => {
    if (!repoDetails) return false;
    const filesCount = repoDetails.metrics?.filesCount ?? 0;
    const linesCount = repoDetails.metrics?.linesCount ?? 0;
    return filesCount > 0 && linesCount > 0;
  }, [repoDetails]);

  const getHealthDisplay = React.useCallback(() => {
    if (!repoDetails) return "Not yet analyzed";
    const isProcessing = ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(repoDetails.status);
    if (isProcessing) {
      return "Analyzing...";
    }
    if (repoDetails.metrics?.complexityScore !== undefined && repoDetails.metrics?.complexityScore !== null) {
      return `${repoDetails.metrics.complexityScore}%`;
    }
    return "Not yet analyzed";
  }, [repoDetails]);

  const handleGenerateDocs = async () => {
    setIsGeneratingDocs(true);
    try {
      const res = await api.post<{ success: boolean; content: string }>(`/v1/repositories/${repositoryId}/docs`, {
        type: docType,
        tone: docTone
      });
      if (res.success) {
        setDocContent(res.content);
        toast.success("AI Documentation generated successfully.");
      }
    } catch (_err: unknown) {
      toast.error("Failed to generate documentation.");
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const handleCopyDocs = () => {
    navigator.clipboard.writeText(docContent);
    toast.success("Documentation copied to clipboard.");
  };

  const handleDownloadDocs = () => {
    const blob = new Blob([docContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docType.toLowerCase()}_documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Markdown documentation downloaded successfully.");
  };

  // Resizing Panels Logic
  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(180, Math.min(380, moveEvent.clientX));
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(480, window.innerWidth - moveEvent.clientX));
      setRightWidth(newWidth);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTabSwitch = (tab: ChatTab) => {
    setActiveTabId(tab.id);
    if (tab.type === "file") {
      setCenterView("code");
      if (tab.filePath) {
        setSelectedFilePath(tab.filePath);
      }
    } else {
      setCenterView(tab.type);
    }
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIdx = tabs.findIndex(t => t.id === tabId);
    if (targetIdx === -1) return;

    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId && newTabs.length > 0) {
      const nextTab = newTabs[Math.max(0, targetIdx - 1)];
      handleTabSwitch(nextTab);
    }
  };

  // Load repository metadata on mount
  React.useEffect(() => {
    interface RawRepositoryResponse {
      id: string;
      name: string;
      owner: string;
      htmlUrl?: string;
      cloneUrl?: string;
      visibility?: string;
      status: RepositoryDetails["status"];
      createdAt: string;
      primaryLanguage?: string | null;
      stars?: number;
      forks?: number;
      watchers?: number;
      defaultBranch?: string;
      chunksCount?: number;
      embeddingsCount?: number;
      metrics?: {
        linesCount: number;
        filesCount: number;
        languages: { name: string; percentage: number }[];
        complexityScore?: number;
        dependencyCount?: number;
      };
    }

    const fetchRepoDetails = async () => {
      setIsLoadingRepo(true);
      try {
        const res = await api.get<{ success: boolean; repository: RawRepositoryResponse }>(
          `/v1/repositories/${repositoryId}`
        );
        if (res.success && res.repository) {
          setRepoDetails({
            id: res.repository.id,
            name: res.repository.name,
            owner: res.repository.owner,
            url: res.repository.htmlUrl || res.repository.cloneUrl || "",
            provider: "github",
            isPrivate: res.repository.visibility === "private",
            status: res.repository.status,
            createdAt: res.repository.createdAt,
            primaryLanguage: res.repository.primaryLanguage,
            stars: res.repository.stars,
            forks: res.repository.forks,
            watchers: res.repository.watchers,
            defaultBranch: res.repository.defaultBranch,
            chunksCount: res.repository.chunksCount,
            embeddingsCount: res.repository.embeddingsCount,
            metrics: res.repository.metrics
              ? {
                  linesCount: res.repository.metrics.linesCount,
                  filesCount: res.repository.metrics.filesCount,
                  languages: res.repository.metrics.languages,
                  complexityScore: res.repository.metrics.complexityScore,
                  dependencyCount: res.repository.metrics.dependencyCount,
                }
              : undefined,
          });
        }
      } catch (_err: unknown) {
        toast.error("Failed to load repository profile.");
      } finally {
        setIsLoadingRepo(false);
      }
    };

    fetchRepoDetails();
  }, [repositoryId]);

  // Load File Explorer Tree Structure
  React.useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await api.get<{ success: boolean; files: FileTreeNode[] }>(
          `/v1/repositories/${repositoryId}/files`
        );
        if (res.success && Array.isArray(res.files)) {
          setFilesTree(res.files);
        }
      } catch {
        toast.error("Failed to fetch repository files structure.");
      }
    };
    fetchTree();
  }, [repositoryId]);

  // Load Past conversations listing
  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; conversations: Conversation[] }>(
        `/v1/conversations?repositoryId=${repositoryId}`
      );
      if (res.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
      }
    } catch {
      console.warn("Failed to load conversations list.");
    }
  }, [repositoryId]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchConversations]);

  // Scroll to bottom of chat
  React.useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom("smooth");
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  // Load health reports on view change
  const fetchHealthReport = React.useCallback(async (refresh = false) => {
    setIsLoadingHealth(true);
    try {
      const res = await api.get<{ success: boolean; report: HealthReport }>(
        `/v1/repositories/${repositoryId}/health${refresh ? "?refresh=true" : ""}`
      );
      if (res.success) {
        setHealthReport(res.report);
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to load health indicators.");
    } finally {
      setIsLoadingHealth(false);
    }
  }, [repositoryId]);

  // Generate mermaid code
  const handleGenerateDiagram = async (force = false) => {
    setIsGeneratingDiagram(true);
    try {
      const res = await api.get<{ success: boolean; mermaidCode: string }>(
        `/repositories/${repositoryId}/diagrams?view=${_diagramView}${force ? "&refresh=true" : ""}`
      );
      if (res.success) {
        setMermaidCode(res.mermaidCode);
        _setZoomScale(1.0);
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to compile architecture diagrams.");
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // Load select file details
  const handleSelectFile = async (filePath: string) => {
    setCenterView("code");
    setSelectedFilePath(filePath);
    _setHighlightedLines(null);

    const tabId = `file-${filePath}`;
    setTabs(prev => {
      if (prev.some(t => t.id === tabId)) return prev;
      return [...prev, { id: tabId, title: filePath.split("/").pop() || filePath, type: "file", filePath }];
    });
    setActiveTabId(tabId);

    if (fileContents[filePath]) return;

    setIsLoadingFile(true);
    try {
      const res = await api.get<{ success: boolean; content: string }>(
        `/v1/repositories/${repositoryId}/file?path=${encodeURIComponent(filePath)}`
      );
      if (res.success) {
        setFileContents((prev) => ({ ...prev, [filePath]: res.content }));
      }
    } catch (_err: unknown) {
      toast.error("Failed to load file contents.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSend = async (textToSend?: string, isRegen = false) => {
    const text = (textToSend || question).trim();
    if (!text || (isSubmitting && !textToSend)) return;

    if (isSubmitting) {
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
      setIsSubmitting(false);
      return;
    }

    if (!textToSend) {
      setQuestion("");
    }

    const controller = new AbortController();
    setAbortController(controller);

    const messageIndex = messages.length;
    const userMessage: Message = {
      id: `msg-user-${messageIndex}`,
      role: "user",
      content: text,
    };

    const assistantMessageId = `msg-assistant-${messageIndex}`;
    const thinkingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    if (isRegen) {
      setMessages((prev) => [...prev, thinkingMessage]);
    } else {
      setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    }
    setIsSubmitting(true);
    setCenterView("chat");
    setActiveTabId("chat-active");
    setShouldAutoScroll(true);

    let accumulatedText = "";
    let hasReceivedToken = false;

    try {
      await api.stream(
        "/v1/chat/stream",
        { repositoryId, question: text, conversationId },
        (chunk) => {
          const lines = chunk.split("\n");
          let currentEvent = "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("event: ")) {
              currentEvent = trimmedLine.replace("event: ", "").trim();
            } else if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.replace("data: ", "").trim();
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (currentEvent === "conversationId") {
                  setConversationId(parsed.conversationId);
                  fetchConversations();
                } else if (currentEvent === "sources") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, sources: parsed }
                        : msg
                    )
                  );
                } else if (currentEvent === "token") {
                  hasReceivedToken = true;
                  accumulatedText += parsed.token;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  );
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        },
        controller.signal
      );
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "AbortError" || controller.signal.aborted) {
        toast.info("Generation cancelled.");
      } else {
        toast.error("A network or server error occurred.");
      }
      if (!hasReceivedToken) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
      }
    } finally {
      setIsSubmitting(false);
      setAbortController(null);
    }
  };

  // Conversation Sidebar Actions
  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    toast.success("New conversation started.");
  };

  const handleClearConversation = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    try {
      await api.delete(`/v1/conversations/${conversationId}`);
      setMessages([]);
      setConversationId(null);
      fetchConversations();
      toast.success("Conversation cleared.");
    } catch {
      setMessages([]);
      setConversationId(null);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard.");
  };

  const handleRegenerateMessage = () => {
    if (messages.length < 2) return;
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) return;
    const lastUserQuery = userMsgs[userMsgs.length - 1].content;

    // Pop last assistant message
    setMessages((prev) => prev.slice(0, -1));
    handleSend(lastUserQuery, true);
  };

  const handleSelectConvo = async (convoId: string) => {
    setConversationId(convoId);
    setMessages([]);
    setIsSubmitting(true);

    try {
      const res = await api.get<{ success: boolean; messages: { id: string; role: string; content: string; sources?: unknown }[] }>(
        `/v1/conversations/${convoId}/messages`
      );
      if (res.success) {
        const mapped = res.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          sources: m.sources ? JSON.parse(JSON.stringify(m.sources)) : undefined,
        }));
        setMessages(mapped);
      }
    } catch {
      toast.error("Failed to load past conversation messages.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameConvo = async (convoId: string) => {
    if (!editingTitle.trim()) return;
    try {
      const res = await api.patch<{ success: boolean }>(
        `/v1/conversations/${convoId}`,
        { title: editingTitle.trim() }
      );
      if (res.success) {
        toast.success("Conversation renamed.");
        fetchConversations();
        setIsEditingConvoId(null);
      }
    } catch {
      toast.error("Rename failed.");
    }
  };

  const handleDeleteConvo = async (convoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.delete<{ success: boolean }>(`/v1/conversations/${convoId}`);
      if (res.success) {
        toast.success("Conversation deleted.");
        fetchConversations();
        if (conversationId === convoId) {
          handleNewChat();
        }
      }
    } catch {
      toast.error("Deletion failed.");
    }
  };

  // Open Citation references in viewer
  const handleOpenCitation = (src: { filePath: string; startLine: number; endLine: number }) => {
    handleSelectFile(src.filePath);
    _setHighlightedLines({ start: src.startLine, end: src.endLine });

    // Jump scroll viewer directly to target citation lines
    setTimeout(() => {
      const lineEl = document.getElementById(`line-${src.startLine}`);
      lineEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 450);
  };

  // Keyboard shortcut layout binds
  React.useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setLeftOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        setRightOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  // Filter Explorer Tree Nodes Helper
  const getFilteredNodes = () => {
    if (!searchFilter) return filesTree;
    const filter = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes
        .map((n) => {
          if (n.type === "file") {
            return n.name.toLowerCase().includes(searchFilter.toLowerCase()) ? n : null;
          }
          const children = filter(n.children || []);
          if (children.length > 0 || n.name.toLowerCase().includes(searchFilter.toLowerCase())) {
            return { ...n, children };
          }
          return null;
        })
        .filter((n): n is FileTreeNode => n !== null);
    };
    return filter(filesTree);
  };

  // Toggle Folder Fold States
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // VS Code File Tree Icons
  const getFileIcon = (fileName: string, isSelected: boolean) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const sizeClass = "size-3.5 shrink-0";

    if (["ts", "tsx"].includes(ext || "")) return <span className={cn(sizeClass, "text-blue-400 font-bold font-mono text-[9px]")}>TS</span>;
    if (["js", "jsx", "mjs", "cjs"].includes(ext || "")) return <span className={cn(sizeClass, "text-yellow-500 font-bold font-mono text-[9px]")}>JS</span>;
    if (["py"].includes(ext || "")) return <span className={cn(sizeClass, "text-sky-400 font-bold font-mono text-[9px]")}>PY</span>;
    if (["json"].includes(ext || "")) return <span className={cn(sizeClass, "text-orange-400 font-bold font-mono text-[9px]")}>{}</span>;
    if (["md", "mdx"].includes(ext || "")) return <span className={cn(sizeClass, "text-emerald-400 font-bold font-mono text-[9px]")}>MD</span>;
    if (["css", "scss", "sass"].includes(ext || "")) return <span className={cn(sizeClass, "text-pink-400 font-bold font-mono text-[9px]")}>#</span>;
    if (["html"].includes(ext || "")) return <span className={cn(sizeClass, "text-red-400 font-bold font-mono text-[9px]")}>&lt;&gt;</span>;

    return <FileCode className={cn(sizeClass, isSelected ? "text-primary" : "text-zinc-500")} />;
  };

  const getFolderIcon = (isExpanded: boolean) => {
    const sizeClass = "size-3.5 shrink-0";
    if (isExpanded) {
      return <FolderOpen className={cn(sizeClass, "text-[#ECC94B]")} />;
    }
    return <Folder className={cn(sizeClass, "text-[#ECC94B]/80")} />;
  };

  // Render Directory Tree Nodes (VS Code Styled)
  const renderTree = (nodes: FileTreeNode[], depth = 0) => {
    return (
      <div className="space-y-0.5 font-mono text-[11px] select-none">
        {nodes.map((node) => {
          const isDir = node.type === "directory";
          const isExpanded = !!expandedFolders[node.path];

          if (isDir) {
            return (
              <div key={node.path} className="space-y-0.5 select-none">
                <button
                  onClick={() => toggleFolder(node.path)}
                  className="w-full flex items-center gap-2 py-1.5 px-2 hover:bg-[#1E2538]/25 rounded-md text-left text-[#94A3B8] hover:text-foreground transition-all cursor-pointer"
                >
                  <span className="w-3 text-center text-[10px] text-zinc-500 select-none">
                    {isExpanded ? "▾" : "▸"}
                  </span>
                  {getFolderIcon(isExpanded)}
                  <span className="truncate font-sans font-medium">{node.name}</span>
                </button>
                {isExpanded && node.children && (
                  <div className="pl-3 border-l border-border/5 ml-3.5 py-0.5 space-y-0.5">
                    {renderTree(node.children, depth + 1)}
                  </div>
                )}
              </div>
            );
          }

          const isSelected = selectedFilePath === node.path;
          return (
            <button
              key={node.path}
              onClick={() => handleSelectFile(node.path)}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-left transition-all cursor-pointer border border-transparent pl-5",
                isSelected
                  ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/20"
              )}
            >
              {getFileIcon(node.name, isSelected)}
              <span className="truncate font-sans">{node.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoadingRepo) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-[calc(100vh-60px)] gap-3 bg-[#0B0F19] text-muted-foreground select-none font-mono text-xs">
        <Loader2 className="size-8 text-primary animate-spin" />
        <span>Initializing grounding space...</span>
      </div>
    );
  }

  if (!repoDetails) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-[calc(100vh-60px)] gap-3 bg-[#0B0F19] text-muted-foreground select-none font-mono text-xs">
        <XCircle className="size-8 text-rose-500" />
        <span>Repository grounding not found or access denied.</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] w-full flex overflow-hidden text-foreground bg-[#0B0F19]">

      {/* COLUMN 1: LEFT SIDEBAR (Explorer & History) */}
      <aside
        className="bg-[#0A0D15] flex flex-col shrink-0 z-30 border-r border-border/20 overflow-hidden transition-all duration-300 ease-in-out select-none"
        style={{ width: leftOpen ? `${leftWidth}px` : "0px" }}
      >
          {/* Top Back Header */}
          <div className="p-4 border-b border-border/10 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors">
              <ChevronLeft className="size-4" />
              <span>Dashboard</span>
            </Link>
            <button onClick={() => setLeftOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer" title="Collapse Sidebar">
              <PanelLeftClose className="size-4.5" />
            </button>
          </div>

          {/* Left Sidebar Tab Navigation */}
          <div className="flex border-b border-border/10 bg-[#0E1220]/10 shrink-0 select-none">
            <button
              onClick={() => handleLeftTabChange("explorer")}
              className={`flex-1 py-2 text-center text-[10px] uppercase font-bold tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                activeLeftTab === "explorer"
                  ? "border-primary text-foreground bg-[#111622]/20"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/10"
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => handleLeftTabChange("chats")}
              className={`flex-1 py-2 text-center text-[10px] uppercase font-bold tracking-wider font-mono border-b-2 transition-all cursor-pointer ${
                activeLeftTab === "chats"
                  ? "border-primary text-foreground bg-[#111622]/20"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/10"
              }`}
            >
              Chats
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {activeLeftTab === "explorer" ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Quick Files Search box */}
                <div className="p-3 border-b border-border/10">
                  <div className="relative bg-[#111622] border border-border/15 rounded-xl p-2 flex items-center gap-2">
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

                {/* Tree Area */}
                <div className="flex-1 overflow-y-auto p-3 pr-2 scrollbar-thin">
                  {getFilteredNodes().length > 0 ? renderTree(getFilteredNodes()) : (
                    <div className="text-center text-xs text-muted-foreground/25 font-mono py-8">No matching files</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Past Chats Area Header */}
                <div className="p-3 border-b border-border/10 flex items-center justify-between shrink-0 bg-[#0E1220]/20">
                  <span className="text-[10px] font-mono text-muted-foreground/60 font-bold uppercase tracking-wider">Saved Chats</span>
                  <button onClick={handleNewChat} className="text-[10px] text-primary hover:underline cursor-pointer font-bold">+ New Chat</button>
                </div>

                {/* Past Chats scroll list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                  {conversations.length === 0 ? (
                    <div className="text-center text-[10px] text-muted-foreground/25 font-mono py-8">No past chats</div>
                  ) : (
                    conversations.map((convo) => {
                      const isActive = convo.id === conversationId;
                      const isEditing = convo.id === isEditingConvoId;
                      return (
                        <div
                          key={convo.id}
                          onClick={() => handleSelectConvo(convo.id)}
                          className={`p-2 border rounded-lg transition-all relative group cursor-pointer ${
                            isActive
                              ? "bg-primary/10 border-primary/20 text-foreground"
                              : "bg-[#111622]/40 border-border/10 hover:border-primary/20 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="bg-[#0B0F19] border border-border/25 rounded px-1.5 py-0.5 text-[10px] text-foreground focus:outline-none flex-1 min-w-0"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameConvo(convo.id);
                                  if (e.key === "Escape") setIsEditingConvoId(null);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5 pr-8">
                              <div className="text-[11px] font-semibold truncate leading-tight">{convo.title}</div>
                            </div>
                          )}

                          {!isEditing && (
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingConvoId(convo.id);
                                  setEditingTitle(convo.title);
                                }}
                                className="text-zinc-400 hover:text-foreground p-0.5 cursor-pointer"
                              >
                                <Edit2 className="size-2.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteConvo(convo.id, e)}
                                className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="size-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
      </aside>

      {/* Resize handle left */}
      {leftOpen && (
        <div
          onMouseDown={startResizeLeft}
          className="w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary border-r border-border/25 z-40 transition-colors"
        />
      )}

      {/* COLUMN 2: CENTER AREA MAIN CANVAS */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080B12] overflow-hidden">

        {/* VS Code Style tabs bar */}
        <div className="h-9 border-b border-border/15 bg-[#0A0D15]/80 flex items-center justify-between shrink-0 select-none overflow-x-auto scrollbar-none">
          <div className="flex items-center h-full">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className={`h-full px-3 flex items-center justify-center border-r border-border/10 cursor-pointer transition-all ${
                leftOpen
                  ? "text-primary hover:bg-[#1E2538]/20"
                  : "text-muted-foreground hover:bg-[#1E2538]/40 bg-primary/5"
              }`}
              title={leftOpen ? "Collapse Explorer" : "Expand Explorer"}
            >
              <PanelLeft className="size-4" />
            </button>
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab)}
                  className={`h-full px-3.5 flex items-center gap-2 border-r border-border/10 cursor-pointer transition-all select-none text-[11px] font-mono ${
                    isActive
                      ? "bg-[#080B12] text-foreground border-t-2 border-t-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/20"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{tab.title}</span>
                  <div className="flex items-center gap-1">
                    {tab.isPinned && <Pin className="size-2.5 text-primary rotate-45 shrink-0" />}
                    {!tab.isPinned && !["chat-active", "overview-active"].includes(tab.id) && (
                      <button
                        onClick={(e) => handleCloseTab(tab.id, e)}
                        className="hover:bg-zinc-800 text-zinc-500 hover:text-foreground p-0.5 rounded cursor-pointer"
                      >
                        <XCircle className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick helper toggles */}
          <div className="px-3 flex items-center gap-1.5 shrink-0 border-l border-border/10">
            <button
              onClick={() => {
                const tabId = "overview-active";
                setActiveTabId(tabId);
                setCenterView("overview");
              }}
              className="px-2 py-1 text-[10px] font-mono hover:bg-[#1E2538]/40 border border-border/25 rounded-md cursor-pointer text-muted-foreground hover:text-foreground"
            >
              🏢 Overview
            </button>
            <button
              onClick={() => {
                const tabId = "health";
                setTabs(prev => {
                  if (prev.some(t => t.id === tabId)) return prev;
                  return [...prev, { id: tabId, title: "📊 Repo Health", type: "health" }];
                });
                setActiveTabId(tabId);
                setCenterView("health");
                if (!healthReport) fetchHealthReport();
              }}
              className="px-2 py-1 text-[10px] font-mono hover:bg-[#1E2538]/40 border border-border/25 rounded-md cursor-pointer text-muted-foreground hover:text-foreground"
            >
              📊 Health
            </button>
            <button
              onClick={() => {
                const tabId = "docs";
                setTabs(prev => {
                  if (prev.some(t => t.id === tabId)) return prev;
                  return [...prev, { id: tabId, title: "📝 AI Docs", type: "docs" }];
                });
                setActiveTabId(tabId);
                setCenterView("docs");
              }}
              className="px-2 py-1 text-[10px] font-mono hover:bg-[#1E2538]/40 border border-border/25 rounded-md cursor-pointer text-muted-foreground hover:text-foreground"
            >
              📝 AI Docs
            </button>
            <button
              onClick={() => {
                const tabId = "diagram";
                setTabs(prev => {
                  if (prev.some(t => t.id === tabId)) return prev;
                  return [...prev, { id: tabId, title: "📐 Architecture Graph", type: "diagram" }];
                });
                setActiveTabId(tabId);
                setCenterView("diagram");
              }}
              className="px-2 py-1 text-[10px] font-mono hover:bg-[#1E2538]/40 border border-border/25 rounded-md cursor-pointer text-muted-foreground hover:text-foreground"
            >
              📐 Graph
            </button>
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className={`px-2 py-1 text-[10px] font-mono border rounded-md cursor-pointer transition-all ${
                rightOpen
                  ? "bg-[#1E2538]/40 border-border/25 text-foreground hover:bg-[#1E2538]/60"
                  : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
              }`}
            >
              ☰ Context
            </button>
          </div>
        </div>

        {/* Dynamic center layout switcher */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Overview canvas section */}
          {centerView === "overview" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#080B12] select-text scrollbar-thin">
              <div className="flex items-center justify-between border-b border-border/10 pb-4 select-none">
                <div>
                  <h1 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                    <span>🏢</span>
                    <span>Repository Overview</span>
                  </h1>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    System architecture, tech stack & grounding entry points for <span className="font-semibold text-foreground">{repoDetails?.name}</span>
                  </p>
                </div>
                <Badge className="bg-primary/15 text-primary border-primary/20 font-mono text-[9px]">
                  Branch: {repoDetails?.defaultBranch || "main"}
                </Badge>
              </div>

              {!isAnalysisAvailable ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="p-4 bg-[#111622]/40 border border-border/10 rounded-2xl">
                    <XCircle className="size-10 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-foreground">No repository analysis available.</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No source files were found in this repository. Push code to the default branch to initiate file scans and semantic embeddings indexing.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Grid 1: Tech Stack, Frameworks & Database */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111625]/30 border border-border/10 rounded-xl space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#636E8B] font-mono">
                        Technology Stack
                      </h3>
                      {repoDetails?.metrics?.languages && repoDetails.metrics.languages.length > 0 ? (
                        <div className="space-y-3">
                          {repoDetails.metrics.languages.slice(0, 3).map((lang) => (
                            <div key={lang.name} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-foreground font-semibold">{lang.name}</span>
                                <span className="text-muted-foreground">{lang.percentage}%</span>
                              </div>
                              <div className="w-full bg-[#1A233C]/40 rounded-full h-1 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${lang.percentage}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono block italic">No languages logged</span>
                      )}
                    </div>

                    <div className="p-4 bg-[#111625]/30 border border-border/10 rounded-xl space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#636E8B] font-mono">
                        Framework Detection
                      </h3>
                      <div className="space-y-3 text-xs font-sans">
                        <div className="flex items-center justify-between py-1 border-b border-border/5">
                          <span className="text-muted-foreground">Framework Type:</span>
                          <span className="text-foreground font-semibold font-mono">
                            {repoDetails?.primaryLanguage === "TypeScript" || repoDetails?.primaryLanguage === "JavaScript"
                              ? "Next.js / Node.js"
                              : repoDetails?.primaryLanguage || "Universal App"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/5">
                          <span className="text-muted-foreground">CSS Engine:</span>
                          <span className="text-foreground font-semibold font-mono">Tailwind CSS / Vanilla CSS</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground">Compiler Mode:</span>
                          <span className="text-foreground font-semibold font-mono">ESM compilation</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#111625]/30 border border-border/10 rounded-xl space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#636E8B] font-mono">
                        Database Specifications
                      </h3>
                      <div className="space-y-3 text-xs font-sans">
                        <div className="flex items-center justify-between py-1 border-b border-border/5">
                          <span className="text-muted-foreground">ORM Engine:</span>
                          <span className="text-foreground font-semibold font-mono">Prisma ORM Client</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/5">
                          <span className="text-muted-foreground">Driver:</span>
                          <span className="text-foreground font-semibold font-mono">PostgreSQL</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground">Vector Database:</span>
                          <span className="text-foreground font-semibold font-mono">pgvector extensions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Core Entry Points & Services */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#111625]/30 border border-border/10 rounded-xl space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#636E8B] font-mono">
                        Core Entry Points
                      </h3>
                      <div className="space-y-2">
                        {[
                          { path: "apps/api/src/index.ts", desc: "API Gateway Server bootstrap" },
                          { path: "apps/web/src/app/page.tsx", desc: "Landing client view" },
                          { path: "apps/api/prisma/schema.prisma", desc: "Prisma database models configuration" },
                          { path: "apps/api/src/workers/repository.worker.ts", desc: "BullMQ worker listener" }
                        ].map((entry) => (
                          <div
                            key={entry.path}
                            onClick={() => handleSelectFile(entry.path)}
                            className="p-2 border border-border/10 hover:border-blue-500/35 rounded-lg bg-[#111625]/20 hover:bg-[#1E2538]/10 cursor-pointer transition-all duration-200 flex justify-between items-center group"
                          >
                            <div className="truncate pr-2 select-none">
                              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate font-mono">
                                {entry.path}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">{entry.desc}</span>
                            </div>
                            <span className="text-[10px] text-primary shrink-0 select-none">View File</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-[#111625]/30 border border-border/10 rounded-xl space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#636E8B] font-mono">
                        Worker Services & Deployments
                      </h3>
                      <div className="space-y-3 text-xs font-sans">
                        <div className="flex items-center justify-between py-1 border-b border-border/5">
                          <span className="text-muted-foreground">Queue Service:</span>
                          <span className="text-foreground font-semibold font-mono">BullMQ / Redis Cache</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/5">
                          <span className="text-muted-foreground">Authentication:</span>
                          <span className="text-foreground font-semibold font-mono">Clerk User Management</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/5">
                          <span className="text-muted-foreground">Dependencies:</span>
                          <span className="text-foreground font-semibold font-mono">{(repoDetails.metrics?.dependencyCount || 0)} packages</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground">Hosting Target:</span>
                          <span className="text-foreground font-semibold font-mono">Vercel Serverless / AWS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {centerView === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <header className="px-5 py-3 border-b border-border/10 bg-[#0A0D15] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <div className="size-8.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shadow-sm">
                    {repoDetails?.name?.slice(0, 2).toUpperCase() || "RA"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground tracking-tight">{repoDetails?.name || "Repository"}</span>
                      {repoDetails?.isPrivate !== undefined && (
                        <span className={`inline-flex items-center px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase rounded border ${
                          repoDetails.isPrivate
                            ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                            : "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                        }`}>
                          {repoDetails.isPrivate ? "Private" : "Public"}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      by <span className="text-foreground/75 font-semibold">{repoDetails?.owner || "Owner"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button variant="outline" size="sm" onClick={handleNewChat} className="h-7 text-[10px] border-border/30 cursor-pointer">
                    New Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearConversation} className="h-7 text-[10px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer">
                    Clear Chat
                  </Button>
                </div>
              </header>

              {/* Chat Canvas Messages list */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin bg-[#080B12]"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto py-16 text-center select-none px-4 space-y-4">
                    <div className="size-9 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-center text-primary/80 shadow-sm">
                      <Sparkles className="size-4" />
                    </div>
                    <h2 className="text-xs font-semibold text-foreground tracking-tight">
                      Codebase Grounding Space
                    </h2>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      Select a suggested prompt below or type a query to search codebase chunks.
                    </p>

                    {/* Suggested Prompts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-4">
                      {[
                        { label: "Explain this project", text: "Provide a high level explanation of this project structure." },
                        { label: "Architecture overview", text: "Generate an architectural overview of this repository." },
                        { label: "Find authentication", text: "Where is authentication and middleware handled in the codebase?" },
                        { label: "Explain database schema", text: "Explain the database models and prisma schema." },
                        { label: "Where is API routing?", text: "Where is API routing and routing logic handled?" },
                        { label: "Find security concerns", text: "Inspect and find potential security concerns in the codebase." }
                      ].map((prompt) => (
                        <button
                          key={prompt.label}
                          onClick={() => handleSend(prompt.text)}
                          className="p-3 text-left bg-[#111622]/35 border border-border/10 hover:border-blue-500/25 hover:bg-[#1E2538]/10 rounded-lg cursor-pointer transition-all space-y-1 group"
                        >
                          <span className="text-[10px] font-bold text-foreground group-hover:text-primary transition-colors block">
                            {prompt.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground block truncate">
                            {prompt.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-4xl mx-auto w-full px-4">
                    {messages.map((msg, idx) => {
                      const isUser = msg.role === "user";
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex gap-4 w-full ${isUser ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border select-none ${
                            isUser ? "bg-primary/10 border-primary/20 text-primary" : "bg-[#111622] border-border/10 text-zinc-400"
                          }`}>
                            {isUser ? "U" : "AI"}
                          </div>

                          <div className={`flex-1 min-w-0 p-4 rounded-xl border text-xs leading-relaxed space-y-3 relative group/msg ${
                            isUser
                              ? "bg-primary/5 border-primary/10 text-foreground rounded-tr-none max-w-[80%] ml-auto"
                              : "bg-[#0E1220]/45 border-border/10 text-[#E2E8F0] rounded-tl-none select-text"
                          }`}>
                            {!isUser && msg.content && (
                              <div className="absolute right-2 top-2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1 select-none">
                                <button
                                  onClick={() => handleCopyMessage(msg.content)}
                                  className="p-1 hover:bg-[#1E2538]/60 text-muted-foreground hover:text-foreground rounded cursor-pointer transition-all"
                                  title="Copy response"
                                >
                                  <CopyIcon className="size-3" />
                                </button>
                                {idx === messages.length - 1 && (
                                  <button
                                    onClick={handleRegenerateMessage}
                                    className="p-1 hover:bg-[#1E2538]/60 text-muted-foreground hover:text-foreground rounded cursor-pointer transition-all"
                                    title="Regenerate response"
                                  >
                                    <RotateCcw className="size-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            {!isUser && isSubmitting && idx === messages.length - 1 && !msg.content ? (
                              <ProgressiveLoader />
                            ) : (
                              <Markdown content={msg.content} />
                            )}

                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-border/10 space-y-2 select-none">
                                <div className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Reference Citations:</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {msg.sources.map((src, sIdx) => (
                                    <div
                                      key={sIdx}
                                      onClick={() => handleOpenCitation(src)}
                                      className="bg-[#111622]/80 hover:bg-[#1E2538] border border-border/20 hover:border-primary/45 rounded-xl p-2.5 transition-all flex items-center justify-between gap-2 cursor-pointer font-mono text-[9px] text-muted-foreground hover:text-foreground"
                                    >
                                      <div className="min-w-0">
                                        <div className="font-semibold text-foreground truncate">{src.filePath.split("/").pop()}</div>
                                        <div>Lines {src.startLine}-{src.endLine}</div>
                                      </div>
                                      <span className="text-emerald-400 font-bold shrink-0">{Math.round(src.similarity * 100)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input panel */}
              <div className="border-t border-border/10 bg-[#0F1424]/60 p-4 shrink-0 select-none">
                <div className="max-w-4xl mx-auto w-full">
                  <div className="relative bg-[#111622]/90 border border-border/15 focus-within:border-primary/35 rounded-xl p-1.5 flex items-end gap-2.5 shadow-lg transition-all">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!isSubmitting && question.trim()) {
                            handleSend();
                          }
                        }
                      }}
                      placeholder="Ask anything about this repository..."
                      className="flex-1 bg-transparent border-none text-xs text-foreground focus:outline-none placeholder:text-muted-foreground/30 resize-none py-2 px-3 min-h-[38px] max-h-[160px] leading-relaxed font-sans"
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={(!isSubmitting && !question.trim())}
                      className="bg-primary hover:bg-primary/95 text-white size-8.5 rounded-lg shrink-0 cursor-pointer p-0 disabled:opacity-40 transition-all flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin text-white" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {centerView === "code" && selectedFilePath && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#0A0D15]">
              <div className="px-4 py-2 border-b border-border/10 bg-[#111622]/60 flex items-center justify-between font-mono text-xs select-none">
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <FileCode className="size-4 text-primary" />
                  <span>{selectedFilePath.split("/").pop()}</span>
                </span>
                <span className="text-muted-foreground/40 text-[10px] select-text max-w-sm truncate">{selectedFilePath}</span>
              </div>
              <div className="flex-1 overflow-auto p-4 select-text">
                {isLoadingFile ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 font-mono text-xs text-muted-foreground">
                    <Loader2 className="size-6 text-primary animate-spin" />
                    <span>Loading file bytes...</span>
                  </div>
                ) : fileContents[selectedFilePath] ? (
                  <pre className="font-mono text-[11px] leading-normal text-[#E2E8F0] select-text">
                    <code>{fileContents[selectedFilePath]}</code>
                  </pre>
                ) : (
                  <div className="text-center py-24 text-xs text-muted-foreground font-mono">No code contents loaded.</div>
                )}
              </div>
            </div>
          )}

          {centerView === "health" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin select-text bg-[#080B12]">
              {!isAnalysisAvailable ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="p-4 bg-[#111622]/40 border border-border/10 rounded-2xl">
                    <XCircle className="size-10 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-foreground">Health analysis unavailable.</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We could not calculate code complexity, maintainability, or security rating because no source files were found in the codebase.
                    </p>
                  </div>
                </div>
              ) : isLoadingHealth ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 font-mono text-xs text-zinc-500 py-24 select-none">
                  <Loader2 className="size-8 text-primary animate-spin" />
                  <span>Generating AI Health Assess Report... This may take up to 20 seconds.</span>
                </div>
              ) : healthReport ? (
                <div className="space-y-6">
                  {/* Category Assessment Cards list */}
                  <div className="p-6 bg-[#111622]/40 border border-border/15 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-extrabold font-mono uppercase tracking-wider text-foreground">Health Summary</h2>
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[9px] py-0 px-2.5">
                          Maturity: {healthReport.maturity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed font-sans">{healthReport.summary}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-[#161D30]/30 border border-border/10 rounded-xl min-w-36 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Overall Score</span>
                      <span className="text-3xl font-extrabold text-foreground font-mono mt-1">{healthReport.overallScore}</span>
                      <span className="text-[9px] text-muted-foreground/50 font-mono">out of 10</span>
                    </div>
                  </div>

                  {/* Clean Top Score Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                    {[
                      { label: "Maintainability", score: healthReport.categories.maintainability?.score || 0, desc: "Modularity & logic quality" },
                      { label: "Complexity", score: repoDetails?.metrics?.complexityScore !== undefined ? (10 - Math.min(10, Math.floor(repoDetails.metrics.complexityScore / 10))) : (healthReport.categories.architecture?.score || 0), desc: "Control flow complexity" },
                      { label: "Documentation", score: healthReport.categories.documentation?.score || 0, desc: "Inline comments coverage" },
                      { label: "Security", score: healthReport.categories.security?.score || 0, desc: "Vulnerability analysis" },
                      { label: "Performance", score: healthReport.categories.performance?.score || 0, desc: "Execution efficiency" }
                    ].map((card) => (
                      <div key={card.label} className="p-4 bg-[#111625]/45 border border-border/10 rounded-xl flex flex-col justify-between select-none">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">{card.label}</span>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-xl font-bold text-foreground font-mono">{card.score}</span>
                          <span className="text-[9px] text-muted-foreground/45 font-mono">/10</span>
                        </div>
                        <span className="text-[9px] text-[#636E8B] font-sans mt-1.5 block leading-tight">{card.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Detailed categories view */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(healthReport.categories).map(([key, cat]) => (
                      <div key={key} className="p-4 bg-[#111622]/30 border border-border/10 rounded-xl space-y-3 font-mono">
                        <div className="flex items-center justify-between select-none">
                          <span className="text-xs font-bold capitalize text-foreground">{key}</span>
                          <span className="text-xs font-extrabold text-primary">{cat.score}/10</span>
                        </div>
                        <div className="w-full bg-[#1E2538]/40 rounded-full h-1 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${cat.score * 10}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-sans">{cat.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-xs text-muted-foreground font-mono select-none">
                  No health reports generated. Select &quot;Generate Health&quot; option.
                </div>
              )}
            </div>
          )}

          {centerView === "docs" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#080B12] select-text scrollbar-thin">
              {!isAnalysisAvailable ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="p-4 bg-[#111622]/40 border border-border/10 rounded-2xl">
                    <BookOpen className="size-10 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-foreground">No documentation available.</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No documentation can be generated because no analyzable source files were found.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-4 select-none">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-5 text-primary" />
                      <Heading level="h2" className="text-sm font-bold text-foreground">AI Documentation Studio</Heading>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-[#111622]/40 border border-border/25 rounded-xl select-none">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground font-mono">Document Type</span>
                      <select
                        value={docType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDocType(e.target.value as "README" | "API_DOCS" | "FOLDER_STRUCTURE" | "SETUP_GUIDE")}
                        className="bg-[#0F1320] border border-border/30 px-2 py-1.5 text-xs rounded-md text-foreground cursor-pointer outline-none"
                      >
                        <option value="README">Project README</option>
                        <option value="API_DOCS">API Specifications</option>
                        <option value="FOLDER_STRUCTURE">Workspace Guide</option>
                        <option value="SETUP_GUIDE">Installation / Setup</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground font-mono">Tone style</span>
                      <select
                        value={docTone}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDocTone(e.target.value as "PROFESSIONAL" | "BEGINNER" | "ENTERPRISE")}
                        className="bg-[#0F1320] border border-border/30 px-2 py-1.5 text-xs rounded-md text-foreground cursor-pointer outline-none"
                      >
                        <option value="PROFESSIONAL">Professional / Engineering</option>
                        <option value="BEGINNER">Simple / Walkthrough</option>
                        <option value="ENTERPRISE">Enterprise Specs</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateDocs}
                    disabled={isGeneratingDocs}
                    className="w-full bg-primary hover:bg-primary/95 text-white font-semibold cursor-pointer"
                  >
                    {isGeneratingDocs ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                    <span>Generate Document</span>
                  </Button>

                  {docContent && (
                    <div className="p-4 bg-[#111622]/20 border border-border/20 rounded-xl space-y-4 select-text">
                      <div className="flex items-center justify-between pb-3 border-b border-border/10 select-none">
                        <span className="text-xs font-mono font-bold text-foreground">Markdown Preview</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopyDocs} className="h-7 text-[10px] cursor-pointer gap-1 text-foreground">
                            <Copy className="size-3" />
                            <span>Copy Markdown</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownloadDocs} className="h-7 text-[10px] cursor-pointer gap-1 text-foreground">
                            <Download className="size-3" />
                            <span>Download Markdown</span>
                          </Button>
                          <Button variant="outline" size="sm" disabled className="h-7 text-[10px] cursor-not-allowed opacity-55">
                            <span>Export PDF (Soon)</span>
                          </Button>
                        </div>
                      </div>

                      <div className="prose prose-invert max-w-none text-xs p-4 bg-[#070A13] rounded-xl border border-border/15 overflow-y-auto max-h-[500px]">
                        <Markdown content={docContent} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Diagrams panel */}
          {centerView === "diagram" && (
            <div className="flex-1 flex flex-col bg-[#080B12] select-none p-3">
              {!isAnalysisAvailable ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center select-text">
                  <div className="p-4 bg-[#111622]/40 border border-border/10 rounded-2xl">
                    <XCircle className="size-10 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-foreground">No architecture graph available.</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The codebase architecture graph could not be mapped because no analyzable code entities or dependency relationships exist.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden">
                  <ArchitectureGraph
                    filesTree={filesTree}
                    onSelectFile={(filePath) => {
                      handleSelectFile(filePath);
                    }}
                    repoName={repoDetails?.name || "Repository"}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Resize handle right */}
      {rightOpen && (
        <div
          onMouseDown={startResizeRight}
          className="w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary border-l border-border/25 z-40 transition-colors"
        />
      )}

      {/* COLUMN 3: RIGHT PANEL */}
      <aside
        className="bg-[#0A0D15] flex flex-col shrink-0 z-30 border-l border-border/20 select-none overflow-hidden transition-all duration-300 ease-in-out font-sans"
        style={{ width: rightOpen ? `${rightWidth}px` : "0px" }}
      >
        <div className="p-3 border-b border-border/10 flex items-center justify-between shrink-0 select-none">
          <span className="text-[9px] font-extrabold uppercase tracking-wider font-mono text-muted-foreground">Overview</span>
          <button
            onClick={() => setRightOpen(false)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/50 transition-all cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelRightClose className="size-3.5" />
          </button>
        </div>

        {repoDetails && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin select-none">
            <div className="space-y-2 font-mono text-[10px]">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Repository Details</span>
              <div className="border border-border/10 rounded-lg divide-y divide-border/10 bg-[#111622]/5">
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-1 py-0.2 text-[8px] font-bold uppercase rounded border ${
                    repoDetails.status === "COMPLETED"
                      ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                      : ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(repoDetails.status)
                      ? "bg-blue-500/5 border-blue-500/15 text-blue-400 animate-pulse"
                      : "bg-red-500/5 border-red-500/15 text-red-400"
                  }`}>
                    {repoDetails.status === "COMPLETED" ? "Ready" : repoDetails.status}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Health</span>
                  <span className={cn(
                    "font-bold font-mono px-1 py-0.2 border rounded text-[8px]",
                    isAnalysisAvailable && repoDetails.metrics?.complexityScore !== undefined
                      ? healthDetails.colorClass.replace("/20", "/15").replace("/40", "/30")
                      : "text-zinc-500 border-border/10 bg-zinc-500/5"
                  )}>
                    {isAnalysisAvailable ? getHealthDisplay() : "Health analysis unavailable."}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Primary Language</span>
                  <span className="text-foreground font-semibold">{repoDetails.primaryLanguage || "None"}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Default Branch</span>
                  <span className="text-foreground font-semibold">{repoDetails.defaultBranch || "main"}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="text-foreground font-semibold">
                    {repoDetails.lastSyncedAt ? new Date(repoDetails.lastSyncedAt).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 font-mono text-[10px]">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Metrics</span>
              <div className="border border-border/10 rounded-lg divide-y divide-border/10 bg-[#111622]/5">
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Files Indexed</span>
                  <span className="text-foreground font-semibold font-mono">{(repoDetails.metrics?.filesCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Lines of Code</span>
                  <span className="text-foreground font-semibold font-mono">{(repoDetails.metrics?.linesCount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-muted-foreground">Embeddings Vectors</span>
                  <span className="text-foreground font-semibold font-mono">{(repoDetails.embeddingsCount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

    </div>
  );
}
