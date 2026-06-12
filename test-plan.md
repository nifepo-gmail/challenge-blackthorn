# Test Plan — E-Commerce Platform (saucedemo.com)

**Version:** 1.0  
**Author:** Nicolas Fernandez Ponce  
**Date:** June 12, 2026  
**Application:** [https://www.saucedemo.com](https://www.saucedemo.com)  
**API Under Test:** [https://fakestoreapi.com](https://fakestoreapi.com) (e-commerce product catalog — used for API contract tests)

---

## 1. Scope and Objectives

### In scope

| Feature | Description |
|---|---|
| Authentication | Login, logout, access control (user types) |
| Product inventory | Listing, display, add/remove from cart |
| Shopping cart | Add, remove, quantity accuracy, session persistence |
| Checkout flow | Contact info form, order summary price accuracy, order confirmation |
| SPA HTTP Contract | Availability, routing, JS bundle, PWA manifest for saucedemo.com |
| Accessibility | Critical-severity axe violations on key pages |

### Out of scope

- Performance and load testing
- Visual regression testing (pixel-level)
- Mobile / responsive layout testing
- Payment gateway integration (not present in demo)
- Backend / database-level validation for saucedemo

---

## 2. Test Approach

### Risk-based prioritization

Tests are selected and ordered by business risk, not feature completeness:

| Priority | Area | Rationale |
|---|---|---|
| Blocker | Login (standard_user) | No login = 0% conversion |
| Blocker | Checkout price accuracy | Wrong charge = direct revenue impact |
| Critical | Access control (locked_out_user) | Security — unauthorized access |
| Critical | Cart item accuracy | Wrong items in order = fulfillment failure |
| Critical | Checkout form validation | Incomplete orders must be blocked |
| Critical | problem_user add-to-cart | Broken purchase path for affected users |
| Normal | Cart persistence | Session integrity across navigation |
| Normal | Empty cart behavior | Edge case — prevents checkout errors |
| Normal | API product price integrity | Corrupt price data breaks UI display |

### Functional testing strategy

- All tests run through the full UI stack (browser → app) to reflect real user journeys.
- Assertions target business outcomes (order completes, price is correct) rather than implementation details.
- The `loggedInPage` fixture is used for tests that presuppose authentication, keeping setup DRY.

### UI validation approach

- Selectors use `data-test` attributes exclusively, which are stable and intention-revealing.
- Brittle XPath and CSS class selectors are avoided.
- Assertions include both state checks (element visibility) and value checks (text content, URL).

### API validation approach

- API tests use Playwright's native `APIRequestContext` via an `ApiClient` service layer.
- Tests never construct URLs or call `request.*` directly — all requests go through endpoint functions.
- Request and response payloads are attached to Allure for every API call (regardless of pass/fail).

### Accessibility approach

- One automated axe scan is run on the inventory page (the highest-traffic page after login).
- Only `critical` impact violations fail the test; lower-severity findings are logged for triage.

---

## 3. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| saucedemo is a demo app — it may have intentional bugs (problem_user) | High | Medium | Document known defects as explicit test expectations |
| Price calculation errors in checkout | Low in demo, high in real apps | Critical | Assert item subtotal = sum of individual prices |
| Session/cookie expiry during test run | Low | High | Keep tests independent; each test navigates to login fresh |
| Test flakiness due to network latency (CI) | Medium | Medium | `retries: 2` on pipeline project; investigate recurring failures |
| CDN unavailability | Low | Low | HTTP tests would fail immediately with clear errors |
| Cross-browser rendering differences | Medium | Medium | Chromium, Firefox, WebKit all configured in CI |

---

## 4. Entry and Exit Criteria

### Entry criteria

- The application under test is accessible at the configured `BASE_URL`.
- `ENV` variable is set (`local` or `pipeline`).
- Playwright and all dependencies are installed (`npm install` + `npx playwright install`).
- Credentials in `src/config/environment.ts` are valid.

### Exit criteria

- All `@smoke` tests pass on Chromium.
- No `blocker` or `critical` test failures remain open.
- Allure report generated and accessible.
- Any known defects are documented with `addIssue()` in the relevant test.

---

## 5. Environment Requirements

### Browser support

| Browser | Engine | Status |
|---|---|---|
| Chrome (latest) | Chromium | Primary |
| Firefox (latest) | Gecko | Supported |
| Safari (latest) | WebKit | Supported |

### Test data

- Credentials are defined in `src/config/environment.ts` per environment.
- No external test data files are required; all test data is either inline or sourced live from saucedemo.com.

### Tooling

| Tool | Version | Purpose |
|---|---|---|
| Playwright | ^1.44 | Browser automation + API testing |
| TypeScript | ^5.4 | Type safety and developer experience |
| allure-playwright | ^3.0 | Test reporting |
| @axe-core/playwright | ^4.9 | Accessibility scanning |
| Node.js | >=18 | Runtime |
