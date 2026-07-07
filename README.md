# CodeAtlas

An AI-powered developer platform that helps developers understand, search, document, navigate, and analyze software repositories.

## Project Overview

CodeAtlas acts as an interactive GPS for software engineering. By analyzing syntax trees, code dependencies, and semantic relations, CodeAtlas creates visual graph maps, keeps module documentation up to date, and lets you query your codebase using natural language.

This repository hosts the **Sprint 1.1 Frontend Foundation** for the application, built on Next.js 15, TypeScript, Tailwind CSS v4, and Framer Motion.

## Features

- **Dynamic Hero Preview**: Interactive developer panel simulating natural-language workspace chat.
- **Repository Architecture Mapping**: Dynamic node-graph mapping of code dependencies (hover/click inspection details).
- **Core Design System**: Custom HSL dark-mode theme, standard 8px spacing metrics, and 12px border radius guidelines.
- **Six Key Capabilities Grid**: Repository Intelligence, Semantic Search, AI Documentation, Architecture Visualization, Code Review Assistant, and Developer Workspace.
- **Sticky Glassmorphic Navigation**: Responsive sticky navigation bar with backdrop blur.
- **Visual Roadmap Timeline**: Track implementation status from Core Foundation to Production deployment.
- **Interactive FAQ Accordion**: Interactive accordion containing five developer-focused Q&As.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (Strict checks)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Component Primitives**: shadcn/ui (Base UI)
- **Formatting & Linting**: Prettier, ESLint (zero warning configuration)

## Folder Structure

```text
src/
├── app/                  # Next.js app router pages, layout, and global CSS
├── assets/               # Localized assets and vector graphics
├── components/
│   ├── common/           # Reusable core components (Card, Heading, Badge, etc.)
│   ├── layout/           # Sticky Header Navbar, Responsive Footer, Logo
│   └── ui/               # Low-level primitive components (shadcn/ui Button)
├── config/               # App configuration files
├── constants/            # Content lists (features, roadmap steps, FAQs)
├── features/
│   └── landing/          # Landing page sub-sections and graphic mockups
├── hooks/                # Custom React hooks
├── interfaces/           # Core TS interfaces
├── lib/                  # Utility libraries consolidation (clsx, tailwind-merge)
├── providers/            # Shared Context/Providers
├── services/             # API services structure (future integration)
├── styles/               # System styling guidelines
├── types/              # System typescript definitions
└── utils/                # Standard helper utilities
```

## Installation

1. Clone the repository and navigate to the directory:
   ```bash
   cd CodeAtlas
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

## Development

To spin up the local development server:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

To verify type safety and ESLint compliance before commits:

```bash
# Verify ESLint & Prettier
npm run lint

# Verify TypeScript compiler
npx tsc --noEmit

# Compile production build
npm run build
```

## Roadmap

- **Phase 01: Foundation** (Completed) - Dark-mode system, core component primitives, and high-fidelity landing page.
- **Phase 02: Repository Management** (In Progress) - Git imports and syntax tree parsing indexer.
- **Phase 03: AI Intelligence** (Upcoming) - Vector embeddings and semantic codebase chat.
- **Phase 04: Developer Productivity** (Upcoming) - Natural-language documentation generation and IDE plugin integrations.
- **Phase 05: Enterprise** (Upcoming) - VPC deployment models, SSO, and granular RBAC permissions.
- **Phase 06: Production** (Upcoming) - Globally scaled multi-region index syncing and active monitoring.
