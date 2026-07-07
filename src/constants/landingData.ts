import {
  Brain,
  Search,
  FileText,
  Layers,
  GitPullRequest,
  Terminal,
} from "lucide-react"

export const FEATURES = [
  {
    icon: Brain,
    title: "Repository Intelligence",
    description: "Navigate complex dependency graphs and identify architectural bottlenecks instantly."
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Search your codebase using natural language concepts instead of exact string matches."
  },
  {
    icon: FileText,
    title: "AI Documentation",
    description: "Keep documentation, READMEs, and component descriptions perpetually up to date."
  },
  {
    icon: Layers,
    title: "Architecture Visualization",
    description: "Automatically compile code structures into clean, interactive dependency diagrams."
  },
  {
    icon: GitPullRequest,
    title: "Code Review Assistant",
    description: "Accelerate reviews with contextual diff summaries and automated PR feedback."
  },
  {
    icon: Terminal,
    title: "Developer Workspace",
    description: "Interact with your code through a command-palette style query box and keyboard shortcuts."
  }
]

export const ROADMAP = [
  {
    phase: "01",
    title: "Foundation",
    status: "Completed",
    description: "Dark-mode design system, component foundation, and high-fidelity dashboard architecture."
  },
  {
    phase: "02",
    title: "Repository Management",
    status: "In Progress",
    description: "Onboard public and private Git repositories with syntax trees indexing."
  },
  {
    phase: "03",
    title: "AI Intelligence",
    status: "Upcoming",
    description: "Vector embeddings generation, semantic index updates, and repository conversational chat."
  },
  {
    phase: "04",
    title: "Developer Productivity",
    status: "Upcoming",
    description: "Natural-language document creation, command line tools, and IDE integration plugins."
  },
  {
    phase: "05",
    title: "Enterprise",
    status: "Upcoming",
    description: "Role-based access controls, self-hosted deployment options, and SLA guarantees."
  },
  {
    phase: "06",
    title: "Production",
    status: "Upcoming",
    description: "Fully scaled auto-sync indices, advanced compliance reporting, and global multi-region support."
  }
]

export const FAQS = [
  {
    question: "How does CodeAtlas index repositories?",
    answer: "CodeAtlas creates semantic indices by analyzing repository syntax trees. It processes language primitives, module dependencies, and code comments to create a structured mapping of the codebase, which is stored securely in encrypted databases."
  },
  {
    question: "Is my private code secure with CodeAtlas?",
    answer: "Yes, security is a core pillar of our architecture. CodeAtlas uses enterprise-grade encryption at rest and in transit. Your repository content is never used for training public foundation models, and you maintain complete control over access permissions."
  },
  {
    question: "Which programming languages are supported?",
    answer: "We support major programming languages including TypeScript, JavaScript, Python, Go, Rust, Java, C++, and Ruby, with syntax-highlighting and dependency graphs compiled out-of-the-box."
  },
  {
    question: "Can I self-host CodeAtlas within our VPC?",
    answer: "Yes. Self-hosted deployments and virtual private cloud installations are supported as part of our Enterprise tier (Phase 5 of our roadmap)."
  },
  {
    question: "How is documentation kept up to date?",
    answer: "CodeAtlas monitors your repository changes via Git Webhooks. When pull requests are merged, CodeAtlas automatically triggers incremental semantic index updates to ensure chatbot references and generated markdown docs stay aligned with the latest commits."
  }
]
