# Walkthrough - Sprint 5.3 AI Architecture Diagram Generator

Implemented an interactive AI Architecture Diagram Workspace in the developer interface that automatically analyzes repository layouts and creates professional diagrams (Folder Structure, Dependency Graph, Service Graph, API Flow, Database Flow) rendered using a dynamic, interactive SVG canvas.

## Files Created / Modified
- **Diagram Service** ([diagram.service.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/services/diagram.service.ts)):
  - Built Mermaid graph code configuration generators for all 5 diagram views.
  - Linked database chunk structures (file listings) and context configuration files (`package.json`, `schema.prisma`) to populate layout metadata.
  - Added filesystem cache layers (`.mermaid` files) under each repository's storage path.
- **Diagram Controller** ([diagram.controller.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/controllers/diagram.controller.ts)):
  - Restricts access to repository owners, sanitizes view arguments, and clears cache on demand.
- **Diagram Router** ([diagram.routes.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/routes/diagram.routes.ts)):
  - Registered GET routes securely behind auth limits.
- **REST Express Router** ([index.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/index.ts)):
  - Mounted the router to resolve `/api/v1/repositories/:id/diagrams` and `/api/repositories/:id/diagrams`.
- **Chat Workspace Page** ([page.tsx](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/web/src/app/(dashboard)/dashboard/repository/[id]/chat/page.tsx)):
  - Designed the **📊 Diagram** workspace panel next to the documentation layout.
  - Added option filters (views selector), zoom/pan controls (Zoom In, Zoom Out, Reset, Drag-to-Pan), and client-side Mermaid rendering with CDN script bindings.
  - Implemented node click interactions: clicking any node extracts its label and matches it to a codebase file path, opening it in the code editor workspace automatically.
  - Integrated SVG, PNG, and Mermaid text format exports.

---

## AI Diagram Layout Mappings

| View | Input View Selection | Render Type | Layout Mapped |
|---|---|---|---|
| `FOLDER_STRUCTURE` | Folder Structure | `flowchart TD` | Hierarchical layout mapping directories, sub-folders, and index files. |
| `DEPENDENCY_GRAPH` | Dependency Graph | `flowchart LR` | Code imports patterns showing modules linkage. |
| `SERVICE_GRAPH` | Service Graph | `flowchart TD` | Call paths linking controllers, services, and processing workers. |
| `API_FLOW` | API Flow | `flowchart LR` | Request execution channels mapping routing middlewares to controller endpoints. |
| `DATABASE_FLOW` | Database Flow | `flowchart TD` / `erDiagram` | Database model structures and relationship cards from schema files. |

---

## Verification & Testing Instructions

1. **Open AI Diagram Panel**:
   - Open `/dashboard/repository/REPO_ID/chat`.
   - Click the **📊 Diagram** tab in the center header.
2. **Generate Diagram**:
   - Select `Database Flow` and click **Generate Graph**. Confirm the ER diagram compiles and renders on the board.
3. **Verify Canvas Controls**:
   - Scroll or click **Zoom In** / **Zoom Out** to verify scale adjustments.
   - Click-drag on the canvas to pan.
4. **Verify File Exploration on Node Click**:
   - Click a node representing a codebase component (e.g. `schema.prisma`).
   - Confirm that the dashboard switches back to `📂 Code Viewer` and displays the respective file contents.
5. **Verify SVG, PNG, and Source Exports**:
   - Trigger export actions to download `.svg`, `.png`, and `.mermaid` code files successfully.
