# Walkthrough - Milestone 3.2.2 Repository Processing Service Decoupling

The indexing and chunk division pipeline has been successfully extracted into a dedicated service, leaving `RepositoryService` strictly as an orchestrator, adhering to the **Single Responsibility Principle**.

## Files Created
- **Repository Processing Service** ([apps/api/src/services/repository-processing.service.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/services/repository-processing.service.ts)):
  - Implements the new `RepositoryProcessingService` class.
  - Takes responsibility for code extraction, sliding window chunking, status database transitions, and Winston logging.
  - Injects `RepositoryRepository`, `CodeChunkRepository`, `FileExtractionService`, and `ChunkingService` via constructor dependency injection.

## Files Modified
- **Repository Service** ([apps/api/src/services/repository.service.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/services/repository.service.ts)):
  - Injects `RepositoryProcessingService` inside the constructor.
  - Cleared legacy chunking/extraction dependencies.
  - Refactored `processRepository()` to perform only repository existence and ownership validation before delegating execution.

---

## Architectural Responsibility Delegation

```mermaid
graph TD
    Client["Express Route Controller / Worker Thread"]
    RepoService["RepositoryService (services/repository.service.ts)"]
    ProcessingService["RepositoryProcessingService (services/repository-processing.service.ts)"]
    DB["PostgreSQL (Prisma Client)"]
    Extractor["FileExtractionService"]
    Chunker["ChunkingService"]

    Client -- "processRepository(id, userId)" --> RepoService
    Note over RepoService: Validation Phase:<br>1. Existence checks<br>2. Ownership validation
    RepoService -- "processRepository(id)" --> ProcessingService
    
    Note over ProcessingService: Execution Phase:<br>1. Status -> PROCESSING<br>2. Delete previous chunks<br>3. Extract & Chunk files<br>4. Bulk save chunks<br>5. Status -> COMPLETED
    ProcessingService -- "Update Status" --> DB
    ProcessingService -- "extractFiles()" --> Extractor
    ProcessingService -- "chunkFile()" --> Chunker
    ProcessingService -- "createMany()" --> DB
```

---

## Verification & Testing Instructions

1. **Start workspace**:
   ```bash
   npm run dev
   ```

2. **Trigger indexing process**:
   - Navigate to `http://localhost:3000/dev/sync-user`.
   * Click **Process Repository** for any imported repository.
   * Verify that the progress completes smoothly through cloning -> analyzing -> processing -> completed and database records are updated as before.
