# BMad Agents Used — bmad-tutorial-1

Full roster of agents and roles used across the project lifecycle.

## Phase 1: Analysis

| Agent | Role | Skill | Output |
|-------|------|-------|--------|
| **Mary** (Analyst) | Strategic business analyst & requirements expert | `bmad-product-brief` | Product brief / ideation |

## Phase 2: Planning

| Agent | Role | Skill | Output |
|-------|------|-------|--------|
| **John** (PM) | Product manager for requirements discovery | `bmad-create-prd` | `prd.md` — 31 FRs, 8 NFRs, 11 ARs |
| **Sally** (UX Designer) | UX designer & UI specialist | `bmad-create-ux-design` | `ux-design-specification.md` + `ux-design-directions.html` |

## Phase 3: Solutioning

| Agent | Role | Skill | Output |
|-------|------|-------|--------|
| **Winston** (Architect) | System architect & technical design leader | `bmad-create-architecture` | `architecture.md` — stack decisions, data model, patterns |
| **Bob** (Scrum Master) | Sprint planning & story preparation | `bmad-create-epics-and-stories` | `epics.md` — 6 epics, 19 stories |
| — | Implementation readiness gate | `bmad-check-implementation-readiness` | `implementation-readiness-report-2026-04-03.md` |
| **Bob** (Scrum Master) | Sprint kickoff | `bmad-sprint-planning` | `sprint-status.yaml` |

## Phase 4: Implementation

| Agent | Role | Skill | Output |
|-------|------|-------|--------|
| **Amelia** (Developer) | Senior engineer for story execution | `bmad-dev-story` | All 6 epics implemented (Epics 1–6) |
| **Blind Hunter** | Adversarial reviewer — no context, diff only | `bmad-review-adversarial-general` | Round 1: 19 findings, Round 2: 19 findings |
| **Edge Case Hunter** | Boundary condition walker — diff + project access | `bmad-review-edge-case-hunter` | Round 1: findings merged, Round 2: 20 findings |
| **Acceptance Auditor** | Spec compliance checker — diff + all specs | `bmad-code-review` (built-in) | Round 1: findings merged, Round 2: 13 findings |
| — | Code review orchestrator | `bmad-code-review` | 2 rounds: 17 + 24 fixes applied |
| — | Project context generator | `bmad-generate-project-context` | `project-context.md` — 42 rules |
| — | Sprint status sync | `bmad-sprint-status` | All stories marked done |
| — | Post-implementation review | `bmad-retrospective` | `retrospective-2026-04-06.md` |

## Phase 4: Testing

| Agent | Role | Skill | Output |
|-------|------|-------|--------|
| **Murat** (Test Architect) | Test planning & framework design | `bmad-testarch-test-design` | `test-design.md` — 6 suites, risk-based |
| — | Framework scaffolding | `bmad-testarch-framework` | Playwright + Chromium in `e2e/` |
| **Quinn** (QA) | E2E test generation | `bmad-qa-generate-e2e-tests` | 33 tests across 6 spec files |

---

**Total: 12 distinct agent roles** across the full lifecycle, from analysis through testing.
