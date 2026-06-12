# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.
It is the **project-agnostic harness template**. When you start a real project,
fill in the `## Project Overview` and `## Tech Stack` sections and adapt the
harness contents under `.harness/` to your domain.

> **New to this kit?** Read [`.harness/GUIDE.md`](.harness/GUIDE.md) first (Tiếng Việt:
> [`.harness/GUIDE.vi.md`](.harness/GUIDE.vi.md)) — it explains the whole mental model (the
> two layers, the state files, the phases, the seam) with examples. This file is the protocol
> to follow; the guide is how to understand it.

## Harness Protocol — MANDATORY, read before anything else

This project uses a delivery harness under `.harness/`. **You must follow it strictly.**
Do not write code, plan features, or suggest next steps without first consulting the
harness state.

### Session start checklist (run every session, no exceptions)

> A `SessionStart` hook ([`.claude/hooks/session-start.js`](.claude/hooks/session-start.js))
> auto-injects a digest of the current state at the top of each session. That digest is a
> pointer, not a substitute — still read the files below in full before acting.

1. Read `.harness/state/DELIVERY_STATE.md` — what is complete, what is next, what is blocked.
2. Read `.harness/state/active-task.md` — the current task, phase, files to read, next action.
3. Read `.harness/state/decisions.md` — locked decisions you must not re-open.
4. Only after reading all three: proceed with the work described in `active-task.md`.

**Lite profile:** small/solo projects may use the single-file lite profile instead — then
read `.harness/state/STATE.md` (one file) and follow `.harness/lite/workflow.md` (Plan →
Build → Verify). See [`.harness/lite/README.md`](.harness/lite/README.md).

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

### Enforcement hooks (not just prose)

Two committed hooks in [`.claude/settings.json`](.claude/settings.json) give the rules above teeth:

- **`SessionStart`** → injects the current delivery-state digest every session (full or lite).
- **`PreToolUse` (Edit/Write)** → `harness-guard.js` warns when you edit source code while the
  harness state is uninitialized or has 0 foundations complete. It ignores edits to
  `.harness/`, `.claude/`, and `docs/`. Soft by default; set `HARNESS_GUARD_STRICT=1` (env) to
  turn the warning into a hard block.

### Where to find things

| File | Purpose |
|---|---|
| `.harness/state/DELIVERY_STATE.md` | Current completion status of all foundations and features |
| `.harness/state/active-task.md` | The single task currently in flight |
| `.harness/state/decisions.md` | Locked architectural and tooling decisions |
| `.harness/state/STATE.md` | Lite profile: single-file state (replaces the three above) |
| `.harness/lite/` | Lite profile: 1-file state + 3-phase workflow for small projects |
| `.harness/workflows/foundations.md` | Full spec for foundations including done-when checklists |
| `.harness/workflows/feature-delivery.md` | Feature module delivery workflow |
| `.harness/rules/` | Coding standards, review policy, e2e testing policy, approval policy |
| `.claude/hooks/` | Enforcement hooks (SessionStart digest, foundations guard) |

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
