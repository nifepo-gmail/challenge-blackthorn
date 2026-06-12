# challenge-blackthorn

![Playwright](https://img.shields.io/badge/Playwright-1.44-45ba4b?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript)
![Allure](https://img.shields.io/badge/Allure-3.0-orange)
![Node](https://img.shields.io/badge/Node-%3E%3D18-339933?logo=node.js)
![CI](https://github.com/actions/workflows/playwright.yml/badge.svg)

Senior QA Engineer challenge solution for Blackthorn.

---

## Table of Contents

- [Overview](#overview)
- [Challenge Deliverables](#challenge-deliverables)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Allure Reporting](#allure-reporting)
- [Environment Variables](#environment-variables)
- [Design Decisions](#design-decisions)
- [Assumptions and Limitations](#assumptions-and-limitations)

---

## Overview

This project implements a risk-based, maintainable Playwright automation suite covering:

- **Web (UI) tests** — authentication, cart management, full checkout flow with price accuracy validation, and accessibility scanning
- **API tests** — REST API contract tests against FakeStore API (schema, price integrity, pagination, category filtering)
- **CI/CD** — GitHub Actions workflow with Allure report upload and GitHub Step Summary

Test selection is prioritized by revenue impact, not feature coverage breadth.

---

## Challenge Deliverables

| Deliverable | File |
|---|---|
| Test Plan | [`test-plan.md`](./test-plan.md) |
| Gherkin Test Scenarios | [`test-cases.md`](./test-cases.md) |
| Playwright Automation | [`tests/`](./tests) |

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | >= 18.0.0 | `node --version` |
| npm | >= 9.0.0 | `npm --version` |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/challenge-blackthorn.git
cd challenge-blackthorn

# 2. Install npm dependencies
npm install

# 3. Install Playwright browsers
#    Linux — Chromium only (no sudo required, sufficient for all default scripts):
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx playwright install chromium

#    Linux — Firefox + WebKit (WebKit requires system libraries, needs sudo):
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx playwright install firefox
sudo env "PATH=$PATH" npx playwright install-deps webkit
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx playwright install webkit

#    In CI / Docker (installs browser + system deps together, requires root):
#    npx playwright install --with-deps

# 4. Set up environment
cp .env.example .env
# Open .env and confirm ENV=local (already set in the example)

# 5. Run the smoke suite
npm run test:smoke
```

---

## Project Structure

```
challenge-blackthorn/
├── .github/workflows/
│   └── playwright.yml          # CI: smoke suite on push + manual suite dropdown
├── src/
│   ├── config/
│   │   └── environment.ts      # Fail-fast env config (local | pipeline)
│   ├── pages/                  # Page Object Model (Po* naming convention)
│   │   ├── base.page.ts        # Shared navigation and interaction helpers
│   │   ├── PoLogin.ts
│   │   ├── PoInventory.ts
│   │   ├── PoCart.ts
│   │   └── PoCheckout.ts
│   └── fixtures/
│       └── index.ts            # Extended Playwright fixtures (page objects)
├── lib/
│   ├── allureHelper.ts         # executeStep(), addFeature(), setSeverity() wrappers
│   └── assertionUtils.ts       # Fluent initialize/expect/finalize with Allure steps
├── tests/
│   ├── web/
│   │   ├── login.spec.ts       # @smoke @challenge — authentication
│   │   ├── cart.spec.ts        # @smoke @challenge — cart + @accessibility
│   │   └── checkout.spec.ts    # @smoke @challenge — checkout + price accuracy
│   └── api/
│       └── products.spec.ts        # @smoke @api @challenge — HTTP contract tests
├── test-plan.md                # Test strategy document
├── test-cases.md               # Gherkin scenarios
├── playwright.config.ts
├── .env.example
└── package.json
```

---

## Running Tests

| Command | Description |
|---|---|
| `npm test` | Run all tests (default project) |
| `npm run test:smoke` | Run `@smoke` tagged tests only |
| `npm run test:challenge` | Run `@challenge` tagged tests only |
| `npm run test:api` | Run `@api` tagged tests only |
| `npm run test:local` | Run against local project (headed Chrome) |
| `npm run test:pipeline` | Run against pipeline project (headless + retries) |
| `npm run test:all-browsers` | Run on Chromium + Firefox + WebKit (WebKit requires system deps — see Quick Start) |

### Running a specific spec file

```bash
npx playwright test tests/web/checkout.spec.ts
```

### Running with headed browser (useful for debugging)

```bash
npx playwright test --headed --project=local
```

---

## Allure Reporting

```bash
# Clean previous results and generate fresh report
npm run allure:clean && npm run test:challenge && npm run allure:report && npm run allure:open

# Generate a single portable HTML file (useful for sharing)
npm run allure:singlefile
```

The Allure report provides:
- Per-test step breakdown (via `executeStep` wrappers)
- Request/response attachments on all API calls
- Screenshots and videos on test failures
- Severity and feature labels for filtering

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ENV` | **Yes** | — | Target environment: `local` or `pipeline`. Throws on startup if not set. |
| `BASE_URL` | No | `https://www.saucedemo.com` | Application under test base URL |
| `API_BASE_URL` | No | `https://fakestoreapi.com` | FakeStore API base URL for REST API tests |
| `SLACK_WEBHOOK_URL` | No | — | Slack webhook for CI notifications (feature/ci-pipeline branch) |

Copy `.env.example` to `.env` for local development.

---

## Design Decisions

### Why risk-based test selection?

Tests are selected by revenue impact, not feature coverage. The three most critical paths — authentication, cart accuracy, and checkout price correctness — are covered with `@smoke` tags so they can always run fast in CI.

### Why HTTP-level API tests against saucedemo.com?

saucedemo has no backend REST API — it is a pure client-side SPA hosted on GitHub Pages, confirmed by sniffing all network requests during a full user journey. The testable HTTP surface was reverse-engineered from real responses: SPA routing via the `/?/` pattern, CDN headers, JS bundle delivery, PWA manifest contract, and the `404.html` redirect gateway. These use Playwright's `request` context directly against the AUT as required by the challenge.

### Why the problem_user test?

saucedemo deliberately provides multiple user personas to simulate different failure modes. `problem_user` has a broken Remove button — a real revenue-impacting defect (user adds an item, can't remove it before placing the order). Documenting it as an explicit test ensures regression visibility if the bug is ever fixed or changes behavior.

### POM structure

Page objects use the `Po*` naming convention from the team's existing TypeScript framework. Each page is a class that receives `page` via its constructor and is instantiated in fixtures, not as module-level singletons (which is not safe in Playwright's parallel execution model).

---

## Assumptions and Limitations

- saucedemo.com is a public demo application. Credentials are hardcoded by design and known publicly.
- The `problem_user` test asserts the defective behavior intentionally. If saucedemo fixes the bug, the test will fail and should be updated.
- saucedemo has no backend API (pure SPA on GitHub Pages). The API tests target the real HTTP contract of the AUT using Playwright's `request` context — SPA routing, CDN headers, JS bundle, and PWA manifest.
- The accessibility test only asserts on `critical`-severity axe violations. Lower-severity findings are surfaced in the Allure report but do not fail the test.
- Cross-browser tests are configured but only the `chromium` project runs by default in CI. Use `npm run test:all-browsers` locally or extend the CI workflow to run all browsers in parallel.
