# Changelog

## v1.2.0 (2026-07-07)
- Completed Sprint 1.2: Project Architecture Scaffolding.
- Installed authentication dependencies: `@clerk/nextjs`, `react-hook-form`, `zod`, `@hookform/resolvers`, and `sonner`.
- Scaffolded feature directories under `src/features/auth` and `src/features/dashboard`.
- Created types, Server Actions structures, client hooks, and barrel exports for the Authentication feature.
- Created repository details interfaces and layout paths for the Dashboard feature.
- Built browser/server compatible fetch wrapper (`api-client.ts`) in `src/lib`.
- Created common helper hooks (`useLocalStorage`, `useMediaQuery`).
- Declared app configuration constants, generic TypeScript interfaces, and validation/formatting utils.
- Integrated barrel exports (`index.ts`) across all major structural component blocks.
- Verified build success with zero errors.

## v1.1.0 (2026-07-07)
- Completed Sprint 1.1: Frontend Foundation.
- Initialized Next.js 15 project with TypeScript, Tailwind CSS v4, and ESLint flat config.
- Configured Prettier and integrated it with ESLint checks.
- Set up a Dark Mode design system with HSL variables, 8px spacing, and 12px border radius.
- Created geometric placeholder vector graphics for branding (logo, favicon).
- Created reusable core UI components: `Container`, `Section`, `Heading`, `Badge`, and `Card`.
- Developed a glassmorphic sticky `Navbar` and responsive `Footer`.
- Built an interactive mockup `DashboardPreview` illustrating AI Chat, Semantic Search, and Documentation generation.
- Built a premium interactive `ProductPreview` mapping code dependencies in a responsive SVG node graph network.
- Implemented responsive landing sections: Hero, Features grid (6 cards), Why CodeAtlas, Roadmap Timeline, and FAQ Accordion.
- Verified zero TypeScript compilation warnings/errors and zero ESLint errors in the production build.

## v0.1.0
- Engineering handbook
- PRD
- Architecture
- Phase 0 complete
