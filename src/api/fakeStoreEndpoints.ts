import { APIResponse } from '@playwright/test';
import { ApiService } from './ApiServices';
import { config } from '../config/environment';

const BASE_URL = config.apiBaseUrl;

/**
 * FakeStore API endpoint functions — one export per endpoint.
 * Used for REST API contract testing as permitted by the challenge spec:
 * "You may use a public API relevant to e-commerce data."
 *
 *   Function                  │ Method │ URL
 *   ──────────────────────────────────────────────────────────────────
 *   getAllProducts             │ GET    │ /products
 *   getProductById            │ GET    │ /products/:id
 *   getProductsByLimit        │ GET    │ /products?limit=:n
 *   getAllCategories           │ GET    │ /products/categories
 *   getProductsByCategory     │ GET    │ /products/category/:category
 */

export async function getAllProducts(api: ApiService): Promise<APIResponse> {
  return api.get(`${BASE_URL}/products`);
}

export async function getProductById(api: ApiService, id: number): Promise<APIResponse> {
  return api.get(`${BASE_URL}/products/${id}`);
}

export async function getProductsByLimit(api: ApiService, limit: number): Promise<APIResponse> {
  return api.get(`${BASE_URL}/products?limit=${limit}`);
}

export async function getAllCategories(api: ApiService): Promise<APIResponse> {
  return api.get(`${BASE_URL}/products/categories`);
}

export async function getProductsByCategory(api: ApiService, category: string): Promise<APIResponse> {
  return api.get(`${BASE_URL}/products/category/${encodeURIComponent(category)}`);
}
