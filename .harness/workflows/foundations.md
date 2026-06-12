# Workflow: Enterprise Foundations

Enterprise teams do not start by writing features. They build the foundations that all features depend on. Getting a foundation wrong means every feature built on top of it is wrong too.

This workflow runs **before** any feature from `workflows/feature-delivery.md` begins. No feature work starts until all required foundations are complete and human-approved.

**Delivery Manager** tracks each foundation as a separate workstream. **Human approval is required** before each foundation's implementation begins.

---

## How to Think About This

When an agent sees a UI screenshot or feature request, the first question is not "how do I code this?" It is:

> "What foundational systems must exist before this is even buildable?"

The multi-client dashboard (see `overview.png`) reveals four foundational systems. None of them have user stories. None appear in the product roadmap. But without them, every feature is either impossible or built on sand.

---

## Foundation 0 — Project Scaffold

**Owner**: DevOps/Platform Agent  
**Blocks**: Everything  
**Human approval**: Required on monorepo and tooling decisions before setup begins

### What It Is

The skeleton every other agent works inside. Not a feature — plumbing.

### Decisions to Lock (human approves)

| Decision | Options | Recommendation |
|---|---|---|
| Monorepo tool | pnpm workspaces / Turborepo / Nx | pnpm workspaces + Turborepo |
| ORM | Drizzle / Prisma / Kysely | Drizzle — SQL-first, TypeScript-native, no magic |
| Auth library | NextAuth v5 / Lucia / custom JWT | NextAuth v5 |
| Migration runner | Drizzle Kit / Flyway | Drizzle Kit |
| CSS / styling | Tailwind / CSS Modules | Tailwind |
| Component library | shadcn/ui / Radix / none | shadcn/ui — copy-paste, no runtime dependency |

### Structure

```
finpilot/
  apps/
    web/                    # Next.js App Router (main application)
    e2e/                    # Playwright test suite
  packages/
    db/                     # Drizzle schema + migrations + seed scripts
    shared/                 # Zod schemas and TypeScript types shared across apps
    ui/                     # shadcn/ui components (if using shared component layer)
  docker-compose.yml        # PostgreSQL dev + PostgreSQL test
  .github/
    workflows/
      ci.yml                # type-check → lint → test → e2e gate
  turbo.json
  pnpm-workspace.yaml
```

### Done When

- [ ] `pnpm dev` starts the Next.js app with a connected PostgreSQL database
- [ ] `pnpm db:migrate` applies migrations cleanly
- [ ] `pnpm type-check` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm e2e` runs (even with zero tests) and produces a report
- [ ] CI pipeline is green on an empty commit

---

## Foundation 1 — Master Data Schema

**Owner**: Solution Architect + Backend Developer  
**Blocks**: All feature modules  
**Human approval**: Required on final schema before any migration is written

### Why This Is a Foundation, Not a Feature

Every entity in the product references the master data schema. Getting the core entities wrong — especially `Client`, `TaxProfile`, and `TaxPeriod` — means refactoring migrations, cascading schema changes, and broken features. Design it once, carefully.

### Core Entities (non-negotiable)

```
Tenant
  id, name, subscription_tier, created_at

User
  id, tenant_id, email, role, created_at
  -- role: TENANT_ADMIN | SENIOR_ACCOUNTANT | ACCOUNTANT | CLIENT_VIEWER

Client                        # the SME
  id, tenant_id, name
  tax_code (MST)              # Vietnamese business tax identification number
  business_type               # individual / LLC / JSC / partnership
  status                      # ACTIVE | ARCHIVED | ONBOARDING
  assigned_accountant_id      # FK to User

TaxProfile                    # what taxes this client is obligated to file
  id, client_id
  has_gtgt        BOOLEAN     # VAT — monthly on the 20th
  has_tndn        BOOLEAN     # Corporate income tax — quarterly
  has_tncn        BOOLEAN     # Personal income tax
  gtgt_method     ENUM        # CREDIT | DIRECT (affects how GTGT is filed)
  fiscal_year_start MONTH     # usually January

TaxPeriod                     # one row per filing obligation per period
  id, client_id, tax_type
  period_start, period_end    # e.g., 2025-01-01 to 2025-01-31
  due_date                    # computed: GTGT = period_end + 20 days, TNDN = quarter_end + 30 days
  status                      # UPCOMING | DUE_SOON | OVERDUE | FILED | LATE_FILED
  filed_at, filed_by

Invoice                       # HĐDT record
  id, client_id, tenant_id
  invoice_number, seller_tax_code, buyer_tax_code
  amount, tax_amount, issue_date
  source                      # PORTAL | OCR | MANUAL
  ocr_confidence JSONB        # per-field confidence scores (null if not OCR)
  ocr_raw_output TEXT         # raw PaddleOCR output (never discard)
  review_required BOOLEAN     # true if any field confidence < 0.85
  status                      # PROCESSING | NEEDS_REVIEW | VERIFIED | REJECTED

Reconciliation
  id, client_id, tax_period_id
  invoice_id
  portal_data JSONB           # data from tax portal (trust: HIGH)
  seller_data JSONB           # seller-declared HĐDT (trust: MEDIUM)
  buyer_data  JSONB           # OCR-parsed buyer copy (trust: LOW)
  match_status                # MATCHED | DISCREPANCY | PENDING_REVIEW
  discrepancy_notes TEXT
  resolved_by, resolved_at

AuditLog                      # append-only
  id, tenant_id, user_id
  entity_type, entity_id
  action                      # CREATE | UPDATE | DELETE | EXPORT | LOGIN
  before JSONB, after JSONB
  timestamp
```

### Key Design Decisions (architect documents rationale for each)

1. **`TaxPeriod` rows are pre-computed, not calculated on the fly.** The dashboard's deadline counter queries them constantly. Pre-compute when a `TaxProfile` is created or updated; regenerate yearly.
2. **`due_date` stores the actual calendar date after NĐ adjustments.** If the 20th falls on a weekend, the due date shifts to the next business day. This logic lives in the deadline engine (Foundation 3).
3. **`ocr_confidence` is JSONB, not a single float.** OCR confidence is per-field (seller name, tax code, amount, date). Storing a single aggregate number loses the ability to show which specific fields need review.
4. **`AuditLog.before/after` redacts sensitive values.** Tax amounts and individual financial data are masked per NĐ 13/2023 before storage in the audit log.

### Done When

- [ ] Schema reviewed and approved by human
- [ ] Drizzle schema files written in `packages/db/schema/`
- [ ] Initial migration generated and tested on a clean database
- [ ] Seed script creates: 2 tenants, 3 users each, 5 clients with different TaxProfiles
- [ ] All foreign key constraints and indexes are in place
- [ ] Tech Lead Reviewer has approved the schema

---

## Foundation 2 — RBAC Design

**Owner**: Solution Architect  
**Blocks**: Auth module, every API route, every UI component  
**Human approval**: Required on the role/permission matrix before implementation

### Why This Is a Foundation, Not a Feature

RBAC that is bolted on after features are built is RBAC that has gaps. Define the full permission matrix now, implement it once in middleware and the API layer, and every future feature inherits it for free.

### Role Definitions

| Role | Scope | Description |
|---|---|---|
| `FINPILOT_ADMIN` | Platform-wide | FinPilot staff; can access all tenants for support |
| `TENANT_ADMIN` | Own tenant | Manages users, client roster, subscription |
| `SENIOR_ACCOUNTANT` | Own tenant (all clients) | Full operations + can approve reconciliations |
| `ACCOUNTANT` | Assigned clients only | Process invoices, run reconciliation, export |
| `CLIENT_VIEWER` | Own SME data only | Read-only; sees their own invoices and filing status |

### Permission Matrix

| Resource | FINPILOT_ADMIN | TENANT_ADMIN | SENIOR_ACCOUNTANT | ACCOUNTANT | CLIENT_VIEWER |
|---|---|---|---|---|---|
| Tenant settings | R/W | R/W own | — | — | — |
| User management | R/W | R/W own | — | — | — |
| Client CRUD | R/W | R/W own | R/W own | R assigned | R own |
| TaxProfile edit | R/W | R/W own | R/W own | R | R own |
| Invoice upload | R/W | R/W own | R/W own | R/W assigned | — |
| Reconciliation approve | R/W | R/W own | R/W own | — | — |
| Reconciliation process | R/W | R/W own | R/W own | R/W assigned | — |
| XML export | R/W | R/W own | R/W own | R/W assigned | — |
| Audit log view | R/W | R own | R own | — | — |
| Billing management | R/W | R/W own | — | — | — |

### Implementation Contract

The architect must specify, for each rule in the matrix:
- Where it is enforced (middleware / API route / query filter / UI hide)
- Primary enforcement layer (always the API/query — UI is defense-in-depth only)

Example:
```
ACCOUNTANT can only read/write invoices for their assigned clients.
  API enforcement: every invoice query includes:
    WHERE tenant_id = session.tenantId
    AND client_id IN (SELECT client_id FROM client_assignments WHERE user_id = session.userId)
  UI: client switcher only shows assigned clients
  NOT enforced by UI alone
```

### Done When

- [ ] Full permission matrix documented and human-approved
- [ ] Enforcement strategy specified per resource
- [ ] `packages/shared/rbac.ts` exports role types and permission check utilities
- [ ] Middleware skeleton applies role check to all protected routes
- [ ] Tech Lead Reviewer has approved

---

## Foundation 3 — Deadline Engine

**Owner**: Backend Developer  
**Blocks**: Dashboard, alert system, client status indicators  
**Human approval**: Required on deadline calculation rules (tax-law interpretation)

### Why This Is a Foundation, Not a Feature

The multi-client dashboard's core value — "which clients are at risk right now?" — is entirely driven by the deadline engine. The "46 chưa hoàn thành" counter, the alert banners, and the deadline panel are all queries against pre-computed `TaxPeriod` rows with their statuses.

The engine has no UI. It is a background service. But without it, the dashboard is a blank screen.

### What It Computes

**GTGT (VAT) — Monthly**
- Period: calendar month
- Raw due date: 20th of the following month
- Adjustment: if the 20th is Saturday → Friday; if Sunday or Monday holiday → next business day
- Vietnamese public holidays must be in a config table (not hardcoded)

**TNDN (Corporate Income Tax) — Quarterly**
- Q1: period ends 31 March → due 30 April
- Q2: period ends 30 June → due 30 July
- Q3: period ends 30 September → due 30 October
- Q4: period ends 31 December → due 30 January (following year)
- Same business-day adjustment rule applies

**Status Transitions**
```
UPCOMING    →    DUE_SOON (≤ 7 days before due_date)
DUE_SOON    →    OVERDUE  (past due_date, not yet filed)
OVERDUE     →    LATE_FILED (filed after due_date)
any         →    FILED    (filed on or before due_date)
```

The status transition job runs daily (or is computed on query — architect decides which).

### Outputs the Dashboard Queries

```sql
-- "46 chưa hoàn thành" counter
SELECT COUNT(*) FROM tax_periods
WHERE tenant_id = $1
AND status IN ('DUE_SOON', 'OVERDUE')
AND period_end <= CURRENT_DATE;

-- Alert banners (red = OVERDUE, orange = DUE_SOON ≤ 3 days, yellow = DUE_SOON)
SELECT tp.*, c.name as client_name
FROM tax_periods tp JOIN clients c ON tp.client_id = c.id
WHERE tp.tenant_id = $1
AND tp.status IN ('OVERDUE', 'DUE_SOON')
ORDER BY tp.due_date ASC;
```

### Done When

- [ ] Human has approved the deadline calculation rules (especially holiday handling)
- [ ] `TaxPeriod` rows are generated correctly for a client with all three tax types
- [ ] Status transitions are correct for all edge cases (due on weekend, public holiday)
- [ ] Unit tests cover: normal month, holiday adjustment, leap year, Q4 TNDN
- [ ] Seed script includes clients in UPCOMING, DUE_SOON, OVERDUE, and FILED states
- [ ] Tech Lead Reviewer has approved

---

## Foundation 4 — Auth + Multi-Tenant Shell

**Owner**: Backend Developer + Frontend Developer (parallel)  
**Blocks**: All UI feature work  
**Depends on**: Foundations 1 and 2 complete  
**Human approval**: Not required (standard pattern), but Tech Lead Reviewer must approve before feature work begins

### What It Is

The skeleton every user interacts with before they reach any feature:
- Login / logout / session
- Tenant context loaded into session token
- Route protection middleware (role-based)
- The application shell: sidebar with client list, header, client switcher
- Client switching without full page reload

### The Client Switcher (Critical UX)

The dashboard shows individual clients in the sidebar. The active client sets the scope for all content in the main panel. This is a core interaction that every feature depends on — it must work correctly before any feature uses it.

Active client context flows:
```
Session → tenantId (always present)
URL param or client context → activeClientId (changes on switch)
All data queries → scoped to both
```

### Done When

- [ ] Login and logout work with session persistence
- [ ] Tenant context is in the session token and verified on every request
- [ ] Middleware blocks unauthenticated and unauthorized routes
- [ ] The shell renders: sidebar, client list, header, client switcher
- [ ] Switching clients updates the active context without a full reload
- [ ] E2E tests: login, logout, route protection, client switch
- [ ] Tech Lead Reviewer has approved

---

## Feature Module Order (after all foundations complete)

| Order | Module | Why this sequence |
|---|---|---|
| 1 | Client management (CRUD) | All other modules reference clients; get the entity right first |
| 2 | Invoice ingestion (manual entry) | Get data into the system before automating how it gets there |
| 3 | Reconciliation (manual review) | Core value; validate the logic before adding OCR or AI |
| 4 | OCR integration (PaddleOCR) | Enhancement on top of working ingestion — not a prerequisite |
| 5 | XML tax filing export | Natural output of a completed reconciliation |
| 6 | Bulk operations and automation | Scale what already works |
| 7 | AI chatbot (RAG) | Additive; does not block the core accounting loop |

---

## Foundation Completion Gate

No feature from `workflows/feature-delivery.md` begins until this checklist is complete:

- [ ] F0: Project scaffold — `pnpm dev` works, CI is green
- [ ] F1: Master data schema — human-approved, migrations tested, seed data ready
- [ ] F2: RBAC matrix — human-approved, enforcement strategy documented
- [ ] F3: Deadline engine — unit tested, seed data covers all status states
- [ ] F4: Auth + shell — E2E login/logout/route-protection tests pass

**Delivery Manager maintains this checklist in `.harness/state/DELIVERY_STATE.md` and reports status to human on request.**
