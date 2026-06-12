# E2E Test Plan Template

Copy this template for each feature's Playwright test planning. Produced by QA Agent before implementation.

---

## Feature Name

<!-- Reference the Feature Plan and Implementation Plan -->

## Scope

**In scope** (user workflows tested E2E):
-

**Out of scope** (tested at unit/integration level or explicitly deferred):
-

## Test Data Requirements

### Users Required

| Role | Email | Tenant | Notes |
|---|---|---|---|
| Tenant admin | admin@test.vn | tenant-A | Full access |
| Accountant | accountant@test.vn | tenant-A | Cannot manage billing |
| Read-only | readonly@test.vn | tenant-A | View only |
| Wrong tenant | other@test.vn | tenant-B | For isolation tests |

### Database State Required

<!-- What must exist in the database before tests run? Backend Developer creates seed scripts for these. -->

- [ ] 2 tenants: tenant-A, tenant-B
- [ ] 3 SME clients under tenant-A
- [ ] At least 1 uploaded invoice per client in various states (processing, complete, flagged)
- [ ] At least 1 complete reconciliation for test-client-1
- [ ] Sample HĐDT PDF in `test-data/sample-invoices/valid-vat-invoice.pdf`

### Selector Requirements

<!-- Elements that Frontend Developer must add data-testid to. -->

| Element | Required selector | Screen |
|---|---|---|
| Upload dropzone | `data-testid="invoice-upload-dropzone"` | Invoice Upload |
| Processing status | `data-testid="invoice-status-processing"` | Invoice Upload |
| OCR result panel | `data-testid="ocr-result-panel"` | Invoice Review |
| Low-confidence field | `data-testid="ocr-field-low-confidence"` | Invoice Review |

---

## Test Scenarios

### Happy Path

**TP-01**: Upload a valid HĐDT and view OCR results
- **Actor**: Accountant
- **Precondition**: Logged in as accountant@test.vn, test-client-1 selected
- **Steps**:
  1. Navigate to Invoice Upload
  2. Drop `valid-vat-invoice.pdf` onto the upload zone
  3. Verify processing status is shown
  4. Wait for OCR result panel to appear
  5. Verify structured invoice fields are displayed
  6. Verify confidence indicators are shown for each field
- **Expected outcome**: Invoice is saved, fields populated, no low-confidence flags for this sample
- **File**: `tests/invoices/upload-happy-path.spec.ts`

**TP-02**: [next scenario]
- ...

---

### Failure Paths

**FP-01**: Upload an invalid file type
- **Actor**: Accountant
- **Precondition**: Logged in, client selected
- **Steps**:
  1. Navigate to Invoice Upload
  2. Attempt to upload a `.exe` file
- **Expected outcome**: Error message displayed; no invoice record created in database
- **File**: `tests/invoices/upload-validation.spec.ts`

**FP-02**: OCR service unavailable
- **Setup**: Mock OCR service to return 503 (or use a seed with `status: 'ocr_failed'`)
- **Expected outcome**: Invoice shows error state; user can retry or manually enter data
- **File**: `tests/invoices/ocr-failure.spec.ts`

---

### Permission / RBAC Scenarios

**RB-01**: Read-only user cannot upload invoices
- **Actor**: readonly@test.vn
- **Steps**: Navigate to Invoice Upload
- **Expected outcome**: Upload action is not available (button absent or disabled; 403 if API called directly)
- **File**: `tests/rbac/invoice-permissions.spec.ts`

**RB-02**: Tenant isolation — tenant-B cannot see tenant-A's invoices
- **Actor**: other@test.vn (tenant-B)
- **Steps**: Attempt to access invoice ID belonging to tenant-A via URL
- **Expected outcome**: 403 or 404 — no tenant-A data is returned
- **File**: `tests/rbac/tenant-isolation.spec.ts`

---

### Edge Cases

**EC-01**: Upload invoice with low OCR confidence
- **Setup**: Use `test-data/sample-invoices/blurry-scan.pdf` (known low-confidence fixture)
- **Expected outcome**: Low-confidence field is visually flagged; invoice is in `needs_review` state
- **File**: `tests/invoices/ocr-low-confidence.spec.ts`

---

## Async Timing Notes

<!-- Document any operations that require waiting. Frontend Developer should document expected delays. -->

| Operation | Expected duration | Wait strategy |
|---|---|---|
| OCR processing | 5–30 seconds | `waitFor` on `data-testid="ocr-result-panel"` with 60s timeout |
| Invoice save | < 1 second | `waitFor` on success toast |

---

## Screenshot / Visual Regression

<!-- Only flag screens that need screenshot regression, not all tests. -->

| Screen | Reason | File |
|---|---|---|
| OCR result panel | Complex layout; catch regressions in field display | `tests/invoices/ocr-result.spec.ts` |

---

## Coverage Map

| Acceptance Criterion | Test Scenario | Status |
|---|---|---|
| AC-1: Upload succeeds | TP-01 | Planned |
| AC-2: Invalid file rejected | FP-01 | Planned |
| AC-3: Low confidence flagged | EC-01 | Planned |
| AC-4: OCR failure handled | FP-02 | Planned |
| AC-5: RBAC enforced | RB-01, RB-02 | Planned |

---

## Approvals

| Role | Name | Date | Decision |
|---|---|---|---|
| Product Analyst | | | Confirms AC coverage |
| Tech Lead Reviewer | | | Confirms depth |
