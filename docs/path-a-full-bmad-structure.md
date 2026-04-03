# Path A — Full BMad Structure

Recommended for projects with enough complexity to benefit from structured planning.
Use this path for the task tracking system (Jira-like) with projects, tasks, assignments,
comments, status workflow, and custom statuses.

---

## Phase 1 — Analysis (Optional)

Skip if you already have a clear product vision. Useful for domain/market research or early ideation.

| Code | Skill | Agent | Required | Description |
|------|-------|-------|----------|-------------|
| BP | `bmad-brainstorming` | — | No | Facilitated ideation if feature scope is unclear |
| DR | `bmad-domain-research` | — | No | Project management domain deep dive |
| MR | `bmad-market-research` | — | No | Competitive landscape (e.g., Jira, Linear, Asana) |
| CB | `bmad-product-brief` | — | No | Nail down the product idea before PRD |

---

## Phase 2 — Planning

Define what you're building. The PRD is the required gate before architecture.

| Code | Skill | Agent | Required | Description |
|------|-------|-------|----------|-------------|
| CP | `bmad-create-prd` | `bmad-agent-pm` | **Yes** | Expert-led facilitation to produce the Product Requirements Document covering all features: project CRUD, task CRUD, assignments, comments, status changes, custom statuses |
| VP | `bmad-validate-prd` | — | No | Validate the PRD against standards; returns prioritized improvement suggestions |
| EP | `bmad-edit-prd` | — | No | Edit PRD based on validation feedback |
| CU | `bmad-create-ux-design` | `bmad-agent-ux-designer` | Recommended | Plan UX patterns and design specs; strongly recommended since UI is the primary interface |

---

## Phase 3 — Solutioning

Define how you're building it. All three steps are required before implementation begins.

| Code | Skill | Agent | Required | Description |
|------|-------|-------|----------|-------------|
| CA | `bmad-create-architecture` | `bmad-agent-architect` | **Yes** | Document technical decisions: stack, data model, API design, auth strategy |
| CE | `bmad-create-epics-and-stories` | `bmad-agent-pm` / `bmad-agent-sm` | **Yes** | Break PRD into epics and user stories that dev agents can execute |
| IR | `bmad-check-implementation-readiness` | — | **Yes** | Gate check: ensures PRD, UX, architecture, epics, and stories are aligned before coding starts |

---

## Phase 4 — Implementation

Execute story by story. Each story follows the cycle below.

| Code | Skill | Agent | Required | Description |
|------|-------|-------|----------|-------------|
| SP | `bmad-sprint-planning` | `bmad-agent-sm` | **Yes** | Produce the sprint plan that implementation agents follow in sequence |
| SS | `bmad-sprint-status` | — | No | Check sprint progress and route to next workflow at any time |
| CS | `bmad-create-story` (create) | `bmad-agent-sm` | **Yes** | Prepare the next story from the sprint plan with full implementation context |
| VS | `bmad-create-story` (validate) | — | No | Validate story readiness and completeness before dev begins |
| DS | `bmad-dev-story` | `bmad-agent-dev` | **Yes** | Implement the story: code + tests |
| CR | `bmad-code-review` | — | No | Adversarial review of implemented story; if issues found → back to DS |
| QA | `bmad-qa-generate-e2e-tests` | `bmad-agent-qa` | No | Generate E2E/API tests for implemented features |
| ER | `bmad-retrospective` | — | No | Optional at epic end: lessons learned, decide next epic or course correction |

### Story Cycle (repeat per story)

```
SP → CS → VS → DS → CR → (fixes? → DS) → next CS
                                        ↓ (epic complete?)
                                        ER → next epic or CC
```

---

## Key Agents

| Agent | Role |
|-------|------|
| `bmad-agent-pm` | Product manager — PRD creation, epics |
| `bmad-agent-ux-designer` | UX designer — design specs |
| `bmad-agent-architect` | System architect — technical decisions |
| `bmad-agent-sm` | Scrum master — sprint planning, story prep |
| `bmad-agent-dev` | Senior developer — story implementation |
| `bmad-agent-qa` | QA engineer — test automation |

---

## Starting Command

Open a fresh context window and run:

```
/bmad-create-prd
```
