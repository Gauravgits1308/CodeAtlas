import {
  Brain,
  Search,
  FileText,
  Layers,
  Activity,
  MessageSquare,
} from "lucide-react"

export const FEATURES = [
  {
    icon: Brain,
    title: "Repository Intelligence",
    description: "Understand entire repositories in seconds. Trace complex architectural maps, nested configurations, and internal module pipelines instantly."
  },
  {
    icon: MessageSquare,
    title: "Grounded AI Chat",
    description: "Every response references actual project files. No generic AI assumptions—all context is securely grounded in your codebase syntax trees."
  },
  {
    icon: Layers,
    title: "Architecture Analysis",
    description: "Automatically understand project structure and trace call stacks. Revora visually compiles components into clean dependency graphs."
  },
  {
    icon: Activity,
    title: "Repository Health",
    description: "Measure maintainability and engineering quality. Track code complexity scores, duplication ratios, and code hotspots."
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Search concepts instead of filenames. Use natural language commands to find logic blocks, utility functions, or API routes."
  },
  {
    icon: FileText,
    title: "AI Documentation",
    description: "Generate developer documentation instantly. Automatically draft structured summaries, onboarding guides, and README updates."
  }
]

export const FAQS = [
  {
    question: "How does Revora connect to my repositories?",
    answer: "Revora integrates securely with GitHub OAuth. You can link your account and grant read-only access to specific public or private repositories in under three clicks. We use official secure protocols."
  },
  {
    question: "Does Revora store my code or use it for AI training?",
    answer: "No. Security is a foundational pillar of Revora. Your source code is never used to train public LLM models. All vector chunks, embeddings, and parsed AST metadata are fully isolated, encrypted, and owned entirely by you."
  },
  {
    question: "How does the Grounded AI Chat differ from generic LLMs?",
    answer: "Unlike standard chatbots that look at code snippets, Revora builds a comprehensive semantic representation of your entire codebase. It crawls import relationships, function signatures, and modules to construct grounded responses complete with file citations."
  },
  {
    question: "What metrics are used to compute Repository Health?",
    answer: "We analyze multiple dimensions of your workspace: average cognitive complexity, duplication density, deep conditional nesting, and outdated modules. We then aggregate these metrics into a simple maintainability rating from F to A+."
  },
  {
    question: "Does Revora support real-time synchronizations?",
    answer: "Yes, Revora synchronizes automatically. By listening to Git Webhooks, we trigger incremental indexing jobs whenever code is pushed, updating vector embeddings and graphs so your AI context stays aligned with your latest commit."
  }
]
