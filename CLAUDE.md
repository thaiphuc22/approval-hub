# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.
It is the **project-agnostic harness template**. When you start a real project,
fill in the `## Project Overview` and `## Tech Stack` sections and adapt the
harness contents under `.harness/` to your domain.

## Harness Protocol — MANDATORY, read before anything else

This project uses a delivery harness under `.harness/`. **You must follow it strictly.**
Do not write code, plan features, or suggest next steps without first consulting the
harness state.

### Session start checklist (run every session, no exceptions)

1. Read `.harness/state/DELIVERY_STATE.md` — what is complete, what is next, what is blocked.
2. Read `.harness/state/active-task.md` — the current task, phase, files to read, next action.
3. Read `.harness/state/decisions.md` — locked decisions you must not re-open.
4. Only after reading all three: proceed with the work described in `active-task.md`.

### Hard rules

- **Never start work outside the active task.** If the delivery state says a given task
  is next, do not begin something else.
- **Never skip a foundation.** No feature work begins until all foundations are marked
  COMPLETE in `DELIVERY_STATE.md`.
- **Never re-open locked decisions.** Approved tech stack, schema, and patterns in
  `decisions.md` are final.
- **Update harness state after every task.** When a task completes, update
  `DELIVERY_STATE.md` and `active-task.md` before ending the session.
- **Human approval gates are real.** If a foundation requires human approval before
  implementation (see `.harness/workflows/foundations.md`), stop and ask.

### Where to find things

| File | Purpose |
|---|---|
| `.harness/state/DELIVERY_STATE.md` | Current completion status of all foundations and features |
| `.harness/state/active-task.md` | The single task currently in flight |
| `.harness/state/decisions.md` | Locked architectural and tooling decisions |
| `.harness/workflows/foundations.md` | Full spec for foundations including done-when checklists |
| `.harness/workflows/feature-delivery.md` | Feature module delivery workflow |
| `.harness/rules/` | Coding standards, review policy, e2e testing policy, approval policy |

---

## Project Overview

<!-- TODO: Replace with your project. Example:
**<Product>** is a <type> for <audience>. The core value proposition is <X>.
Key regulatory / business context: <...>.
-->

## Tech Stack

<!-- TODO: Replace with your stack. Example:
- **Framework**: Next.js (App Router) with TypeScript
- **Database**: PostgreSQL
- **Testing**: Playwright (E2E), Jest/Vitest (unit)
-->

## Development Commands

<!-- TODO: Replace with your commands. Example:
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Run test suite
```
-->

## Architecture

<!-- TODO: Describe your domain modules, data model, and any non-negotiable
constraints (tenancy, trust hierarchy, compliance) so every agent respects them.
The shipped `.harness/` files contain a worked example (a multi-tenant SaaS) you
can use as a reference and then replace. -->
