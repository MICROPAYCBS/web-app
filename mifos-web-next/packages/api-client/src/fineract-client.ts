/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractApiError, FineractClientConfig } from './types';

export class FineractHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: FineractApiError | null
  ) {
    super(body?.defaultUserMessage ?? body?.developerMessage ?? `HTTP ${status}`);
    this.name = 'FineractHttpError';
  }
}

/**
 * Minimal typed HTTP client for Apache Fineract REST APIs.
 * Expand with resource modules (clients, loans, etc.) as domains are implemented.
 */
export class FineractClient {
  constructor(private readonly config: FineractClientConfig) {}

  private async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; searchParams?: Record<string, string> }
  ): Promise<T> {
    const url = new URL(path.replace(/^\//, ''), `${this.config.baseUrl.replace(/\/$/, '')}/`);
    if (options?.searchParams) {
      Object.entries(options.searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const auth = await this.config.getAuthHeader();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Fineract-Platform-TenantId': this.config.tenantId
    };
    if (auth) {
      headers['Authorization'] = auth;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined
    });

    if (!res.ok) {
      let body: FineractApiError | null = null;
      try {
        body = (await res.json()) as FineractApiError;
      } catch {
        body = null;
      }
      throw new FineractHttpError(res.status, body);
    }

    if (res.status === 204) {
      return undefined as T;
    }
    return (await res.json()) as T;
  }

  get<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, { searchParams });
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }
}
