# E2E Testing Policy

This policy governs all Playwright E2E testing in FinPilot. Any coding agent must follow it without guessing.

---

## Directory Structure

```
apps/e2e/
  playwright.config.ts          # single config file; all projects defined here
  tests/
    auth/                       # login, logout, session expiry, protected routes
    dashboard/                  # multi-client view, client switching, status indicators
    invoices/                   # upload, OCR status, manual review queue, OCR failure
    reconciliation/             # 3-way match, flag, approve, override
    tax-filing/                 # XML export, submission, export history
    chatbot/                    # AI query, source display, error handling
    clients/                    # client CRUD, archiving
    billing/                    # plan limits, upgrade prompt
    rbac/                       # role-based access, tenant isolation
  fixtures/
    auth.fixture.ts             # per-role storage state management
    database.fixture.ts         # test DB setup/teardown, transaction helpers
  pages/
    BasePage.ts                 # shared navigation, common assertions
    LoginPage.ts
    DashboardPage.ts
    InvoiceUploadPage.ts
    InvoiceReviewPage.ts
    ReconciliationPage.ts
    TaxFilingPage.ts
    ChatbotPage.ts
  helpers/
    api-setup.ts                # create tenants, clients, invoices, users via API
    file-helpers.ts             # load sample HĐDT files
    wait-helpers.ts             # named wait utilities
  test-data/
    sample-invoices/            # realistic HĐDT PDFs and XMLs
      valid-vat-invoice.pdf
      blurry-scan.pdf           # for low-confidence tests
      invalid-format.exe        # for rejection tests
    seed-scripts/
      baseline.sql              # applied before test suite
```

---

## playwright.config.ts Baseline

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    // Auth setup runs first
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Accountant tests
    {
      name: 'accountant-chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/accountant.json',
      },
    },

    // Admin tests
    {
      name: 'admin-chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
    },

    // Firefox (CI only)
    ...(process.env.CI ? [{
      name: 'accountant-firefox',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/accountant.json',
      },
    }] : []),
  ],
})
```

---

## Selector Rules (Enforced)

### Priority Order

1. `page.getByRole('button', { name: /upload/i })` — buttons, links, checkboxes, radios, headings
2. `page.getByLabel('Invoice file')` — labeled form inputs
3. `page.getByText('Reconciliation complete')` — unique visible text
4. `page.getByPlaceholder('Search clients...')` — inputs with placeholders
5. `page.getByTestId('invoice-upload-dropzone')` — only when 1–4 cannot uniquely identify

### Prohibited

```ts
// NEVER — CSS class
page.locator('.btn-primary')
page.locator('.invoice-row')

// NEVER — index-based
page.locator('table tr:nth-child(3)')
page.locator('ul > li:first-child')

// NEVER — XPath (unless last resort with documented reason)
page.locator('//div[@class="container"]/button')

// NEVER — arbitrary waits
await page.waitForTimeout(3000)
```

### data-testid Naming Convention

Format: `kebab-case`, scoped to component purpose.

```
invoice-upload-dropzone
invoice-status-processing
invoice-status-complete
invoice-status-needs-review
ocr-result-panel
ocr-field-{fieldName}                  # e.g., ocr-field-seller-tax-id
ocr-field-low-confidence               # applied to any field below threshold
reconciliation-row-{invoiceId}
reconciliation-flag-button
reconciliation-approve-button
client-card-{clientId}
client-switcher
tax-export-button
tax-export-history-row-{exportId}
chatbot-input
chatbot-response-panel
chatbot-source-citation
```

---

## Auth Pattern

### Setup File

```ts
// tests/auth/auth.setup.ts
import { test as setup } from '@playwright/test'
import { LoginPage } from '../../pages/LoginPage'

setup('authenticate as accountant', async ({ page }) => {
  const login = new LoginPage(page)
  await login.goto()
  await login.login('accountant@test.vn', process.env.E2E_ACCOUNTANT_PASSWORD!)
  await page.context().storageState({ path: 'playwright/.auth/accountant.json' })
})

setup('authenticate as admin', async ({ page }) => {
  const login = new LoginPage(page)
  await login.goto()
  await login.login('admin@test.vn', process.env.E2E_ADMIN_PASSWORD!)
  await page.context().storageState({ path: 'playwright/.auth/admin.json' })
})
```

### Test File Using Storage State

```ts
// tests/invoices/upload.spec.ts
import { test, expect } from '@playwright/test'
// No login needed — storageState is loaded from playwright.config.ts

test('uploads a valid invoice', async ({ page }) => {
  await page.goto('/clients/test-client-1/invoices/upload')
  // ...
})
```

---

## Test Data Pattern

### API Setup (Preferred)

```ts
import { test, expect } from '@playwright/test'
import { createTestClient, createTestInvoice } from '../../helpers/api-setup'

test.beforeAll(async ({ request }) => {
  await createTestClient(request, { tenantId: 'tenant-a', name: 'SME Test Co' })
})

test.afterAll(async ({ request }) => {
  await cleanupTestData(request, { tenantId: 'tenant-a' })
})
```

### Data Isolation

Each test run uses either:
- A unique `tenant_id` per run (generated in setup), **OR**
- Database transactions that roll back after each suite

Never assume shared data exists from a previous run.

---

## Waiting Rules

```ts
// CORRECT — wait for a specific state
await page.getByTestId('ocr-result-panel').waitFor({ state: 'visible', timeout: 60_000 })
await page.getByTestId('invoice-status-processing').waitFor({ state: 'hidden', timeout: 60_000 })

// CORRECT — wait for network idle after action
await page.getByRole('button', { name: /upload/i }).click()
await page.waitForURL(/\/invoices\/[a-z0-9-]+/)

// CORRECT — wait for API response
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/invoices') && r.status() === 202),
  page.getByTestId('invoice-upload-dropzone').setInputFiles('test-data/sample-invoices/valid-vat-invoice.pdf'),
])

// WRONG — arbitrary timeout
await page.waitForTimeout(5000)
```

---

## Page Object Model Pattern

```ts
// pages/InvoiceUploadPage.ts
import { Page, Locator } from '@playwright/test'

export class InvoiceUploadPage {
  readonly page: Page
  readonly dropzone: Locator
  readonly statusProcessing: Locator
  readonly statusComplete: Locator
  readonly ocrResultPanel: Locator

  constructor(page: Page) {
    this.page = page
    this.dropzone = page.getByTestId('invoice-upload-dropzone')
    this.statusProcessing = page.getByTestId('invoice-status-processing')
    this.statusComplete = page.getByTestId('invoice-status-complete')
    this.ocrResultPanel = page.getByTestId('ocr-result-panel')
  }

  async goto(clientId: string) {
    await this.page.goto(`/clients/${clientId}/invoices/upload`)
  }

  async uploadFile(filePath: string) {
    await this.dropzone.setInputFiles(filePath)
  }

  async waitForOcrComplete(timeout = 60_000) {
    await this.statusProcessing.waitFor({ state: 'hidden', timeout })
    await this.ocrResultPanel.waitFor({ state: 'visible', timeout })
  }
}
```

---

## CI Commands

```bash
pnpm e2e                               # all tests, headless
pnpm e2e:ui                            # Playwright UI mode (interactive)
pnpm e2e:headed                        # headed browser (debug locally)
pnpm e2e:report                        # open HTML report from last run
pnpm e2e -- --grep "reconciliation"   # run tests matching pattern
pnpm e2e -- --project accountant-chromium  # run specific project
pnpm playwright install --with-deps chromium firefox  # install browsers
```

---

## Flakiness Policy

A test is flaky if it passes sometimes and fails other times on the same code.

1. A flaky test must **not** be silently accepted — create a GitHub issue immediately.
2. Do not increase `retries` to hide flakiness.
3. Common causes to investigate:
   - Race condition between OCR job and test assertion → fix with `waitFor`
   - Shared test data mutated by a concurrent test → fix with data isolation
   - Selector matches multiple elements → make selector more specific
   - Network timeout in CI → increase timeout with a comment explaining why
4. Flaky tests must be fixed within the same sprint they are identified.

---

## Skipping Tests

A test may be skipped only with a documented reason:

```ts
test.skip(
  'reconciliation XML export — skipped: XML export not yet implemented (see issue #42)',
  async () => { /* ... */ }
)
```

Skipped tests without a reason or issue reference are rejected in code review.

---

## Done Definition for E2E

A feature's E2E coverage is complete when:

1. All acceptance criteria have at least one corresponding Playwright assertion
2. At least one failure path is tested per critical operation
3. RBAC is tested (unauthorized user cannot perform the action)
4. Test data is isolated and repeatable
5. No `waitForTimeout` calls exist in the test
6. All tests pass in CI without retries (green, not passed-on-retry)
7. Tech Lead Reviewer has approved the test coverage via `templates/test-review.md`
