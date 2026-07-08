# Walkthrough - Milestone 2.5.2 Background Repository Processing Completed

The codebase processing pipeline has been successfully migrated to run inside asynchronous BullMQ background jobs. The API controller immediately returns status `QUEUED` with the BullMQ Job ID, and the developer page displays real-time progress bars by polling the status endpoint.

## Files Created
- **Queue Connection Config** ([apps/api/src/queue/queue.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/queue/queue.ts)):
  - Declares connection parameters utilizing parsed configurations (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`).
- **Repository Queue Config** ([apps/api/src/queue/repository.queue.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/queue/repository.queue.ts)):
  - Instantiates the BullMQ Queue for `"repository-processing"`.
- **Repository Job Worker** ([apps/api/src/workers/repository.worker.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/workers/repository.worker.ts)):
  - Registers the BullMQ worker processing loop executing:
    1. Clone repository (Status -> `CLONING`, Progress -> 10%)
    2. Analyze codebase LOC and directories (Status -> `ANALYZING`, Progress -> 40%)
    3. Partition files into sliding-window chunks (Status -> `PROCESSING`, Progress -> 70%)
    4. Save status on complete (Status -> `COMPLETED`, Progress -> 100%)
  - Reverts status to `FAILED` if any exceptions occur.
- **Repository Job Service** ([apps/api/src/services/repository-job.service.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/services/repository-job.service.ts)):
  - Validates ownership, updates DB Status to `QUEUED`, enqueues the job into BullMQ, and returns the Job ID.
- **Job Status Controller** ([apps/api/src/controllers/job.controller.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/controllers/job.controller.ts)):
  - Resolves job execution states by querying BullMQ and falling back to database records when tasks complete and are cleared from Redis.
- **Job Router** ([apps/api/src/routes/job.routes.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/routes/job.routes.ts)):
  - Exposes `GET /api/v1/jobs/:jobId` protected by `requireAuth`.

## Files Modified
- **Prisma Schema** ([apps/api/prisma/schema.prisma](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/prisma/schema.prisma)):
  - Added `PROCESSING` to the `RepositoryStatus` enum options.
- **Repository Controller** ([apps/api/src/controllers/repository.controller.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/controllers/repository.controller.ts)):
  - Refactored `processRepository` to immediately return HTTP 202 on process triggers.
- **Server Index** ([apps/api/src/index.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/index.ts)):
  - Mounted job router and booted worker threads.
- **Developer Debug Dashboard** ([apps/web/src/app/dev/sync-user/page.tsx](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/web/src/app/dev/sync-user/page.tsx)):
  - Submits asynchronous processing requests, shows real-time progress meters, and polls the job status endpoint every 2 seconds.

---

## Background Processing Architecture

```mermaid
graph TD
    Client["Client (Browser)"]
    Controller["RepositoryController (controllers/repository.controller.ts)"]
    JobService["RepositoryJobService (services/repository-job.service.ts)"]
    Queue["BullMQ Queue (queue/repository.queue.ts)"]
    Redis[("Redis In-Memory Data Store")]
    Worker["BullMQ Worker (workers/repository.worker.ts)"]
    DB["PostgreSQL (Prisma)"]
    Disk["Local Storage (storage/repositories/{id})"]

    %% Enqueue phase
    Client -- "POST /api/v1/repositories/:id/process" --> Controller
    Controller -- "enqueueRepository(id, userId)" --> JobService
    JobService -- "updateStatus(id, QUEUED)" --> DB
    JobService -- "Add Process Job" --> Queue
    Queue -- "Save task metadata" --> Redis
    JobService -- "Return Job ID" --> Controller
    Controller -- "HTTP 202 { jobId, status: QUEUED }" --> Client

    %% Polling phase
    Client -- "GET /api/v1/jobs/:jobId" --> Client
    Client -- "Poll every 2 seconds" --> Controller
    Controller -- "fromId(jobId)" --> Redis
    Redis -- "State, progress %, stage" --> Controller
    Controller -- "HTTP 200 { state, progress, stage }" --> Client

    %% Worker Execution phase
    Worker -- "Listen / Process next job" --> Redis
    
    Note over Worker: Step 1: Clone Repository
    Worker -- "updateStatus(id, CLONING)" --> DB
    Worker -- "cloneRepository()" --> Disk
    
    Note over Worker: Step 2: Analyze codebase
    Worker -- "updateStatus(id, ANALYZING)" --> DB
    Worker -- "analyzeRepository()" --> Disk
    Worker -- "createOrUpdateCodeMetric()" --> DB
    
    Note over Worker: Step 3: Extract & Chunk files
    Worker -- "updateStatus(id, PROCESSING)" --> DB
    Worker -- "processRepository()" --> Disk
    Worker -- "createManyCodeChunks()" --> DB
    
    Note over Worker: Success Completed
    Worker -- "updateStatus(id, COMPLETED)" --> DB
    Worker -- "Mark Job Completed" --> Redis
```

---

## Testing & Validation Instructions

1. **Start Redis**:
   Make sure you have a local Redis server running at port `6379`.
   ```bash
   redis-server
   ```

2. **Boot monorepo**:
   ```bash
   npm run dev
   ```

3. **Validate live background processing**:
   * Navigate to `http://localhost:3000/dev/sync-user`.
   * Log in using Clerk.
   * Click **Fetch GitHub Repositories** and select one of your repositories.
   * Click **Import** to store it in PostgreSQL (State: `PENDING`).
   * Click **Process Repository**.
   * The page will display the BullMQ Job ID, status as `QUEUED`, and start polling.
   * The progress bar will transition smoothly through stages:
     - **CLONING** (10%)
     - **ANALYZING** (40%)
     - **PROCESSING** (70%)
     - **COMPLETED** (100%)
   * Once complete, the repository status in the Postgres table displays `COMPLETED`, and the stats block renders the chunk information.
