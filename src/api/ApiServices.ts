import { APIRequestContext, APIResponse } from '@playwright/test';

interface RequestConfig {
  headers?: Record<string, string>;
}

/**
 * Playwright APIRequestContext wrapper.
 * Mirrors the ApiService / AxiosConfig pattern from conserv-automation,
 * adapted for Playwright's built-in request context (no extra HTTP client needed).
 *
 * Instantiated per-test via the `apiService` fixture in src/fixtures/index.ts.
 */
export class ApiService {
  constructor(private readonly request: APIRequestContext) {}

  async get(url: string, config?: RequestConfig): Promise<APIResponse> {
    return this.request.get(url, { headers: config?.headers, failOnStatusCode: false });
  }

  async post(url: string, data?: unknown, config?: RequestConfig): Promise<APIResponse> {
    return this.request.post(url, { data, headers: config?.headers, failOnStatusCode: false });
  }
}
