# Test Cases — E-Commerce Platform (saucedemo.com)

Scenarios are written in Gherkin syntax and ordered by business risk (highest first).  
Tags are used for selective CI execution: `@smoke`, `@challenge`, `@api`, `@accessibility`.

---

## TC-001 — Standard user logs in successfully
`@smoke @challenge` | **Risk: Blocker**

```gherkin
Scenario: Standard user logs in and reaches the product inventory
  Given I am on the saucedemo login page
  When I enter username "standard_user" and password "secret_sauce"
  And I click the Login button
  Then I should be redirected to the inventory page
  And the page title should be "Swag Labs"
```

---

## TC-002 — Checkout total matches sum of item prices
`@smoke @challenge` | **Risk: Blocker**

```gherkin
Scenario: Checkout overview displays the correct item subtotal
  Given I am logged in as "standard_user"
  And I have added "Sauce Labs Backpack" and "Sauce Labs Bike Light" to my cart
  When I proceed through checkout and fill in valid contact information
  Then the item subtotal on the checkout overview should equal the sum of individual item prices
  And the grand total should equal the item subtotal plus tax
```

---

## TC-003 — Locked-out user is denied access
`@challenge` | **Risk: Critical**

```gherkin
Scenario: Locked out user cannot access the application
  Given I am on the saucedemo login page
  When I enter username "locked_out_user" and password "secret_sauce"
  And I click the Login button
  Then I should remain on the login page
  And I should see the error message "Sorry, this user has been locked out"
```

---

## TC-004 — Checkout is blocked when required fields are missing
`@challenge` | **Risk: Critical**

```gherkin
Scenario: Attempting checkout without filling required contact fields is rejected
  Given I am logged in as "standard_user"
  And I have at least one item in my cart
  And I have navigated to the checkout contact information form
  When I click the Continue button without filling any fields
  Then I should see an error message indicating that First Name is required
  And I should remain on the checkout step-one page
```

---

## TC-005 — Adding multiple items updates cart count and contents
`@smoke @challenge` | **Risk: Critical**

```gherkin
Scenario: User adds multiple items and cart reflects correct count and names
  Given I am logged in as "standard_user"
  When I add "Sauce Labs Backpack" to the cart
  And I add "Sauce Labs Bike Light" to the cart
  Then the cart badge should display "2"
  And the cart page should contain both "Sauce Labs Backpack" and "Sauce Labs Bike Light"
```

---

## TC-006 — Removing an item updates the cart correctly
`@challenge` | **Risk: Critical**

```gherkin
Scenario: User removes an item from the cart and cart contents update
  Given I am logged in as "standard_user"
  And I have "Sauce Labs Backpack" and "Sauce Labs Bike Light" in my cart
  When I remove "Sauce Labs Backpack" from the cart
  Then the cart should contain exactly 1 item
  And "Sauce Labs Backpack" should no longer be in the cart
```

---

## TC-007 — Cart contents persist after navigating back to inventory
`@challenge` | **Risk: High**

```gherkin
Scenario: Cart items are retained after navigating away from the cart and returning
  Given I am logged in as "standard_user"
  And I have added "Sauce Labs Fleece Jacket" to my cart
  When I navigate back to the inventory page via "Continue Shopping"
  And I navigate to the cart page again
  Then "Sauce Labs Fleece Jacket" should still be in the cart
```

---

## TC-008 — problem_user: add-to-cart is broken for specific items (known defect)
`@challenge` | **Risk: Critical**

```gherkin
Scenario: problem_user cannot add Sauce Labs Backpack to the cart
  Given I am on the saucedemo login page
  When I log in as "problem_user"
  And I click "Add to Cart" for "Sauce Labs Backpack"
  Then the cart badge should NOT appear
  And the item should NOT be added to the cart
  # NOTE: This is a known defect in saucedemo's problem_user scenario.
  # The "Add to Cart" button does not toggle, so the item is never added.
  # This test documents the defect; a fix would be detected by a failing assertion.
```

---

## TC-009 — Invalid credentials are rejected with an error message
`@challenge` | **Risk: Critical**

```gherkin
Scenario: User submits wrong username and password and is denied access
  Given I am on the saucedemo login page
  When I enter username "unknown_user" and password "wrong_password"
  And I click the Login button
  Then I should remain on the login page
  And I should see the error message "Username and password do not match any user in this service"
  And the username and password fields should display the error icon
```

---

## TC-010 — Empty cart shows an empty state and blocks checkout
`@challenge` | **Risk: High**

```gherkin
Scenario: User navigates to the cart with no items added
  Given I am logged in as "standard_user"
  And I have not added any items to the cart
  When I navigate to the cart page
  Then the cart item list should be empty
  And the cart badge should not be visible in the navigation bar
  And the "Checkout" button should be visible but proceeding should not be possible with zero items
```

---

## TC-011 — Cart contents persist after a full page refresh
`@challenge` | **Risk: High**

```gherkin
Scenario: Items added to cart survive a browser page reload
  Given I am logged in as "standard_user"
  And I have added "Sauce Labs Backpack" to my cart
  When I reload the page (F5 / hard refresh)
  Then I should still be on the inventory page (session is preserved)
  And the cart badge should still display "1"
  And navigating to the cart page should still show "Sauce Labs Backpack"
```

---

## API Test Cases

---

## TC-API-001 — All SPA routes are reachable via the `/?/` routing pattern
`@smoke @api @challenge` | **Risk: Blocker**

```gherkin
Scenario: All application routes return 200 via the GitHub Pages SPA redirect pattern
  Given saucedemo.com is hosted on GitHub Pages with no server-side SPA fallback
  When I send GET requests to:
    | /?/inventory.html         |
    | /?/cart.html              |
    | /?/checkout-step-one.html |
    | /?/checkout-step-two.html |
    | /?/checkout-complete.html |
  Then every response should return status 200
  And every response body should contain the React root element <div id="root">
  And every response body should contain the SPA URL restore script
  # NOTE: Direct access (e.g. /inventory.html) returns 404 — GitHub Pages
  # has no SPA fallback. Routes are accessible only via the /?/ pattern,
  # which is handled by 404.html (spa-github-pages, MIT license).
```

---

## TC-API-002 — Main JavaScript bundle is accessible and non-trivial
`@smoke @api @challenge` | **Risk: Blocker**

```gherkin
Scenario: The JS bundle that powers the entire SPA is delivered by the server
  Given the saucedemo.com server is running
  When I fetch the root HTML page to extract the hashed JS bundle URL
  And I send a GET request to the extracted bundle path
  Then the response status should be 200
  And the Content-Type header should include "javascript"
  And the bundle size should be greater than 100KB
  And gzip compression should be enabled
  # NOTE: saucedemo is a pure client-side SPA. All authentication, cart,
  # and checkout logic runs in this JS bundle. If it returns 404 or 500,
  # the application is completely non-functional for all users.
```

---

## TC-API-003 — PWA manifest.json has correct app metadata
`@api @challenge` | **Risk: Normal**

```gherkin
Scenario: manifest.json serves correct PWA metadata
  Given the saucedemo.com server is running
  When I send a GET request to /manifest.json
  Then the response status should be 200
  And the Content-Type should be application/json
  And the name field should be "Swag Labs"
  And the theme_color should be "#eefcf6"
  And the icons array should contain 4 entries
```
