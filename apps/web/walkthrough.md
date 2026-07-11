# Walkthrough - Sprint 4.9 Explain Selection AI Modes Refactoring

Refactored the code Selection Review panel to route and trigger specialized AI analysis modes for each toolbar action.

## Files Created / Modified
- **Explain Selection Service** ([explain-selection.service.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/services/explain-selection.service.ts)):
  - Extended the analysis logic to route incoming modes (`EXPLAIN`, `SUMMARIZE`, `BUG_REVIEW`, `OPTIMIZE`, `SECURITY`) to specialized system prompts enforcing target format headings.
- **Explain Selection Controller** ([explain-selection.controller.ts](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/api/src/controllers/explain-selection.controller.ts)):
  - Validates and sanitizes the `mode` parameter received from client payloads.
- **Chat Workspace Page** ([page.tsx](file:///Users/gauravgupta/Desktop/CodeAtlas/apps/web/src/app/(dashboard)/dashboard/repository/[id]/chat/page.tsx)):
  - Updated selection toolbar buttons click triggers to map to target mode strings.
  - Linked panel headings to display custom labels representing the active evaluation context (e.g. *Code Explanation*, *Code Summary*, *Bug Review*, *Performance Review*, *Security Audit*).

---

## Analysis Modes Prompt Routing

| Mode | Input Toolbar Button | Header Heading | Target Analysis Layout & Headers |
|---|---|---|---|
| `EXPLAIN` | `✨ Explain` | Code Explanation | `📌 Purpose`, `⚙️ How It Works`, `🔗 Dependencies`, `💡 Why It Exists`, `📖 Example Flow` |
| `SUMMARIZE` | `📝 Summarize` | Code Summary | `Overview`, `Responsibilities`, `Inputs`, `Outputs`, `Key Logic` |
| `BUG_REVIEW` | `🐛 Find Bugs` | Bug Review | `Critical Issues`, `Medium Issues`, `Low Issues`, `Suggested Fixes` |
| `OPTIMIZE` | `⚡ Optimize` | Performance Review | `Current Implementation`, `Optimization Opportunities`, `Refactored Example`, `Estimated Benefit` |
| `SECURITY` | `🔐 Security` | Security Audit | `Risk Level`, `Findings`, `Recommendations`, `Example Fixes` |

---

## Verification & Testing Instructions

1. **Verify Mode Prompts**:
   - Open Repository Explorer, highlight a code segment, and click the toolbar actions.
   - Confirm that the side drawer panel header updates dynamically.
   - Confirm that the response sections match the required markdown formats.
