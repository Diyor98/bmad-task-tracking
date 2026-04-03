# Path B — Fast Track (Quick Dev)

Use this path when you want working code quickly and are comfortable iterating as you go.
Skips formal planning documents — intent goes straight to implementation in a single workflow.

Best for: prototypes, solo projects, or when the feature set is small enough to hold in one context.

---

## Single Phase — Quick Dev

All steps happen within one skill invocation. No separate planning, architecture, or sprint documents.

| Code | Skill | Agent | Required | Description |
|------|-------|-------|----------|-------------|
| QQ | `bmad-quick-dev` | — | **Yes (entry point)** | Unified workflow: clarify intent → plan → implement → review → present |

### What happens inside Quick Dev

1. **Clarify** — Agent asks clarifying questions about your feature list and constraints
2. **Plan** — Lightweight spec created inline (not a full PRD)
3. **Implement** — Code is written following the plan
4. **Review** — Adversarial self-review of the generated code
5. **Present** — Summary of what was built and how to run it

---

## Optional Add-ons (run after Quick Dev)

These can enhance the output without requiring a full planning phase.

| Code | Skill | Agent | Required | Description |
|------|-------|-------|----------|-------------|
| CR | `bmad-code-review` | — | No | Adversarial code review if you want a second pass on quality |
| QA | `bmad-qa-generate-e2e-tests` | `bmad-agent-qa` | No | Generate automated E2E/API tests for what was built |
| GPC | `bmad-generate-project-context` | — | No | Produce a lean `project-context.md` for future AI sessions |
| CC | `bmad-correct-course` | — | No | Navigate significant changes if the initial output needs major rework |

---

## Trade-offs vs Path A

| Concern | Path B (Quick Dev) | Path A (Full Structure) |
|---------|--------------------|------------------------|
| Speed to first code | Fast | Slower |
| Structured requirements | No | Yes (PRD) |
| Architecture decisions documented | No | Yes |
| Testability / coverage tracking | Manual | Built-in via TEA module |
| Handles scope growth well | Poorly | Well |
| Recommended for team projects | No | Yes |

---

## When to Switch to Path A

If during Quick Dev you find:
- The feature scope keeps expanding
- You need to onboard other developers
- Data model decisions feel risky without documentation
- Tests are hard to write because requirements are unclear

Run `/bmad-correct-course` to pivot to a structured approach without starting over.

---

## Starting Command

Open a fresh context window and run:

```
/bmad-quick-dev
```

Describe your intent: a Jira-like task tracking system with project CRUD, task CRUD,
task assignment, comments, task status changes, and custom status creation.
