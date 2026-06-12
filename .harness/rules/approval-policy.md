# Approval Policy

Defines exactly when a human must approve before work continues. The purpose is to prevent agents from making irreversible or high-impact decisions autonomously.

---

## Human Approval Required Before Implementation

These situations must be paused until a human confirms the direction:

| Situation | Why |
|---|---|
| New feature: requirements approved | Prevents building the wrong thing |
| New external service integration | Cost, legal, and operational implications |
| Changes to the tenant isolation mechanism | Data breach risk; irreversible if wrong |
| Changes to the HTKK/eTax XML schema version | Regulatory compliance; all clients affected |
| Changes to the billing enforcement logic | Revenue impact; customer trust |
| Changes to the audit log schema or retention | Legal/compliance implications |
| Destructive database migration (DROP, TRUNCATE) | Irreversible data loss risk |
| Addition of a new NĐ or GDT rule to the engine | Regulatory interpretation; requires legal review |

---

## Human Approval Required Before Merging

These situations require human sign-off in addition to Tech Lead Reviewer approval:

| Situation | Why |
|---|---|
| Any security finding from code review that required a design change | Verify the mitigation is understood |
| Tenant isolation breach — bug fix | Verify root cause is addressed, not just symptom |
| Any change that affects the reconciliation auto-flag vs auto-resolve logic | Trust is the product's core value |

---

## Human Approval Required Before Release

See `workflows/release-readiness.md` for the full pre-release checklist. Human sign-off is always required before production deployment.

---

## Agents Must Not Do Without Human Approval

- Delete or archive tenant data
- Change a subscription tier for a tenant
- Disable or skip E2E tests permanently in CI
- Add a new external API that receives raw financial data
- Modify the trust hierarchy between reconciliation data sources
- Change logging or audit retention settings

---

## How to Request Human Approval

When human approval is needed, the agent must:

1. Stop work on the item requiring approval.
2. Write a clear, specific question with the options being considered and the trade-offs of each.
3. Include any relevant context (links to design docs, code, regulatory references).
4. Do not proceed until an explicit approval is received.

Generic questions ("should I continue?") are not acceptable. The question must be specific enough that the human can make an informed decision in one response.

---

## Autonomous Decisions Agents May Make

Agents may make the following decisions without human approval:

- Choosing between equivalent implementation approaches (e.g., two valid ways to structure a query)
- Selecting specific Playwright selector strategies
- Choosing test data values that are clearly non-sensitive
- Deciding file/module organization within an approved design
- Selecting retry counts and timeout values for jobs and tests
- Refactoring internals without changing external behavior
- Adding log statements (observing logging policy)
- Updating minor/patch dependency versions

When in doubt, ask.
