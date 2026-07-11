# Walkthrough - Milestone 3.3.5 Dashboard Sync Button Connection

The dashboard's **Sync** button is now connected directly to the existing backend queue processing route (`POST /api/v1/repositories/:id/process`).

## Files Modified
- **Dashboard Page Component** ([apps/web/src/app/(dashboard)/dashboard/page.tsx](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/web/src/app/(dashboard)/dashboard/page.tsx)):
  - Updated `handleSyncRepo` to make an asynchronous `api.post` call to `/v1/repositories/${id}/process`.
  - Disables action items and displays spinner classes to signal background analysis queue operations.
  - Automatically fetches updated repository list from `/v1/repositories` upon successful queuing.
  - Triggers toast alerts informing the user of the queuing status or failure codes.

---

## Sync Integration Flow

```mermaid
graph TD
    User["Dashboard Page View"]
    SyncBtn["Clicks Sync Button on Repository Card"]
    Spinner["Button disables and RefreshCw spins"]
    PostRequest["POST /api/v1/repositories/:id/process"]
    BackendQueue["Job Queued (BullMQ / Redis)"]
    SuccessToast["Toast Success: Repository queued for processing"]
    RefreshCall["GET /api/v1/repositories"]
    StatusUpdate["Card status updates to 'indexing'"]

    User --> SyncBtn
    SyncBtn --> Spinner
    Spinner --> PostRequest
    PostRequest --> BackendQueue
    BackendQueue -- "HTTP 202 JSON Response" --> PostRequest
    PostRequest -- "1. Trigger toast" --> SuccessToast
    PostRequest -- "2. Re-fetch repositories list" --> RefreshCall
    RefreshCall --> StatusUpdate
```

---

## Verification & Testing Instructions

1. **Verify Sync Trigger Pipeline**:
   - Access the dashboard page at `/dashboard`.
   - Click the **Sync** button next to any imported repository.
   - Verify that the card's status badge updates to `Indexing` and the sync button spins.
   - Check the backend console to confirm the logs output:
     * `Job queued`
     * `Worker started`
     * `Clone started`
     * `Analysis started`
     * `Processing completed`
