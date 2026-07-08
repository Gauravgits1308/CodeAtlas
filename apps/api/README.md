# CodeAtlas API Service

Production-ready backend API service for CodeAtlas, designed using Clean Architecture principles and structured as a monorepo workspace package.

---

## Architecture
The API conforms to **Clean Architecture** patterns to decouple core business logic from databases and framework details:

* **Inversion of Dependencies**: Inner layers (Prisma DB, Express web engine) depend on outer layers (controllers, use-cases), never vice versa.
* **Separation of Concerns**: Request parameter validation, execution services, database persistence, and worker synchronization are completely isolated.

---

## Folder Structure
```text
apps/api/src/
├── config/                 # Environment variables & constants configuration
├── database/               # Database client connection instances (Prisma)
├── repositories/           # Repository layer abstractions for data queries
├── services/               # Integrations for GitHub API clients & BullMQ job triggers
├── use-cases/              # Core business rules & logic cases
├── controllers/            # Controller layers parsing HTTP parameters
├── routes/                 # Express REST endpoint maps
├── middleware/             # Validation checks & Clerk auth middleware handlers
├── utils/                  # Winston logger, error classes, custom wrappers
├── types/                  # Internal TypeScript type definitions
└── index.ts                # Main bootstrap server file
```

---

## Setup & Environment Variables
Create a `.env` file inside `apps/api/` or at the monorepo root containing variables specified in `.env.example`:

* `PORT`: Server listening port (default: `4000`)
* `NODE_ENV`: Runtime execution mode (`development` | `production`)
* `DATABASE_URL`: PostgreSQL DB connection string
* `REDIS_URL`: Redis database connection string (required for BullMQ)
* `CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: Clerk identity validation keys
* `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: GitHub OAuth client credentials

---

## Available Scripts

Run scripts from the monorepo root using `npm run <script> -w apps/api` or directly inside this directory:

* `npm run dev`: Bootstraps nodemon hot-reloads watching `src/**/*.ts`.
* `npm run build`: Compiles TypeScript files into the `dist/` directory.
* `npm run start`: Boots up compiled server code using node.
* `npm run lint`: Validates code files against ESLint checkers.
* `npm run format`: Standardizes formatting styles using Prettier.
* `npm run prisma:generate`: Compiles Prisma schemas and generates types.
* `npm run prisma:migrate`: Runs migrations / pushes schemas to PostgreSQL database.

---

## Authentication & Header Protocols
The backend API expects specific HTTP headers on authenticated route calls:
* `Authorization`: `Bearer <clerk_session_jwt>` (validated by the Clerk JWT verification middleware).
* `X-Github-Token`: `<github_oauth_access_token>` (forwarded by the frontend API client. Future repository indexing, discover, and sync endpoints will consume this header to call the GitHub API on behalf of the user).
