/**
 * @suite API — FakeStore Product Catalog
 * @risk High — product data integrity directly affects what users see and purchase.
 *              A corrupt price, missing schema field, or broken category filter
 *              would silently propagate into the UI and cause wrong orders.
 *
 * Why FakeStore API?
 *   saucedemo.com has no backend REST API — all logic runs client-side.
 *   The challenge spec explicitly permits: "You may use a public API relevant
 *   to e-commerce data." FakeStore provides a realistic REST API matching
 *   the e-commerce domain being tested.
 *
 * Covers:
 *  - Schema contract: every product has the required fields          @smoke @api @challenge
 *  - Price integrity: no product has a zero or negative price        @smoke @api @challenge
 *  - Single resource: GET /products/:id returns a valid product      @api @challenge
 *  - Pagination: limit parameter returns the correct number          @api @challenge
 *  - Categories: endpoint returns a non-empty list of strings        @api @challenge
 *  - Category filter: filtered results only contain the target cat   @api @challenge
 */

import { test } from '../../src/fixtures/index';
import { addFeature, addStory, setSeverity, executeStep, attachJson, applyAllureLabels } from '../../lib/allureHelper';
import { assertionUtils } from '../../lib/assertionUtils';
import {
  getAllProducts,
  getProductById,
  getProductsByLimit,
  getAllCategories,
  getProductsByCategory,
} from '../../src/api/fakeStoreEndpoints';

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
  image: string;
}

test.describe('@smoke @api @challenge FakeStore Product Catalog', () => {
  test.beforeEach(async () => {
    await applyAllureLabels(__filename);
    await addFeature('Product Catalog API');
  });

  // ─── Schema contract ────────────────────────────────────────────────────────

  test('GET /products — every product conforms to the e-commerce schema', async ({ apiService }) => {
    await addStory('Product schema contract');
    await setSeverity('blocker');

    const response = await executeStep('GET /products', async () => getAllProducts(apiService));
    const products = await executeStep('Parse response body', async () => response.json()) as Product[];

    await attachJson('Products (first 3)', products.slice(0, 3));

    const assertions = assertionUtils.initialize('Schema contract assertions');
    assertions
      .expect('Status 200',              response.status(),  200, 'toBe')
      .expect('Response is an array',    Array.isArray(products), true, 'toBe')
      .expect('Catalog is not empty',    products.length > 0,     true, 'toBe');
    await assertions.finalize();

    await executeStep('Validate schema for each product', async () => {
      const REQUIRED_FIELDS: (keyof Product)[] = ['id', 'title', 'price', 'category', 'description', 'image'];
      for (const product of products) {
        for (const field of REQUIRED_FIELDS) {
          if (product[field] === undefined || product[field] === null) {
            throw new Error(`Product id=${product.id} is missing required field: "${field}"`);
          }
        }
        if (typeof product.price !== 'number') {
          throw new Error(`Product id=${product.id} has non-numeric price: ${product.price}`);
        }
      }
    });
  });

  // ─── Price integrity ────────────────────────────────────────────────────────

  test('GET /products — no product has a zero or negative price', async ({ apiService }) => {
    await addStory('Price integrity — no zero or negative prices');
    await setSeverity('blocker');

    const response = await executeStep('GET /products', async () => getAllProducts(apiService));
    const products = await executeStep('Parse response body', async () => response.json()) as Product[];

    const invalidPrices = products.filter((p) => p.price <= 0);
    await attachJson('Invalid price products (should be empty)', invalidPrices);

    const assertions = assertionUtils.initialize('Price integrity assertions');
    assertions
      .expect('Status 200',                          response.status(),       200, 'toBe')
      .expect('No products with price <= 0',         invalidPrices.length,    0,   'toBe');
    await assertions.finalize();
  });

  // ─── Single resource ────────────────────────────────────────────────────────

  test('GET /products/1 — single product by ID has valid schema and price', async ({ apiService }) => {
    await addStory('Single product resource — schema and price');
    await setSeverity('critical');

    const response = await executeStep('GET /products/1', async () => getProductById(apiService, 1));
    const product = await executeStep('Parse response body', async () => response.json()) as Product;

    await attachJson('Product', product);

    const assertions = assertionUtils.initialize('Single product assertions');
    assertions
      .expect('Status 200',             response.status(),            200,    'toBe')
      .expect('ID matches requested',   product.id,                   1,      'toBe')
      .expect('Title is non-empty',     typeof product.title === 'string' && product.title.length > 0, true, 'toBe')
      .expect('Price is positive',      product.price > 0,            true,   'toBe')
      .expect('Category is non-empty',  typeof product.category === 'string' && product.category.length > 0, true, 'toBe')
      .expect('Image URL is present',   typeof product.image === 'string' && product.image.startsWith('http'), true, 'toBe');
    await assertions.finalize();
  });

  // ─── Pagination ─────────────────────────────────────────────────────────────

  test('GET /products?limit=3 — limit parameter returns exactly 3 products', async ({ apiService }) => {
    await addStory('Pagination — limit parameter');
    await setSeverity('normal');

    const response = await executeStep('GET /products?limit=3', async () => getProductsByLimit(apiService, 3));
    const products = await executeStep('Parse response body', async () => response.json()) as Product[];

    const assertions = assertionUtils.initialize('Limit parameter assertions');
    assertions
      .expect('Status 200',            response.status(),  200, 'toBe')
      .expect('Exactly 3 products',    products.length,    3,   'toBe');
    await assertions.finalize();
  });

  // ─── Categories ─────────────────────────────────────────────────────────────

  test('GET /products/categories — returns a non-empty list of category strings', async ({ apiService }) => {
    await addStory('Product categories — contract');
    await setSeverity('normal');

    const response = await executeStep('GET /products/categories', async () => getAllCategories(apiService));
    const categories = await executeStep('Parse response body', async () => response.json()) as string[];

    await attachJson('Categories', categories);

    const assertions = assertionUtils.initialize('Categories assertions');
    assertions
      .expect('Status 200',              response.status(),                  200,  'toBe')
      .expect('Response is an array',    Array.isArray(categories),          true, 'toBe')
      .expect('At least 1 category',     categories.length > 0,              true, 'toBe')
      .expect('All entries are strings', categories.every((c) => typeof c === 'string'), true, 'toBe');
    await assertions.finalize();
  });

  // ─── Category filter ────────────────────────────────────────────────────────

  test("GET /products/category/electronics — all results belong to 'electronics'", async ({ apiService }) => {
    await addStory("Category filter — 'electronics' returns only electronics");
    await setSeverity('normal');

    const allCatsResponse = await executeStep('GET /products/categories to pick a real category', async () =>
      getAllCategories(apiService)
    );
    const categories = await allCatsResponse.json() as string[];
    const target = categories[0];

    const response = await executeStep(`GET /products/category/${target}`, async () =>
      getProductsByCategory(apiService, target)
    );
    const products = await executeStep('Parse response body', async () => response.json()) as Product[];

    await attachJson(`Products in category "${target}" (first 3)`, products.slice(0, 3));

    const wrongCategory = products.filter((p) => p.category !== target);
    await attachJson('Products with wrong category (should be empty)', wrongCategory);

    const assertions = assertionUtils.initialize('Category filter assertions');
    assertions
      .expect('Status 200',                          response.status(),       200,  'toBe')
      .expect('Results are non-empty',               products.length > 0,     true, 'toBe')
      .expect('All products belong to target cat',   wrongCategory.length,    0,    'toBe');
    await assertions.finalize();
  });
});
