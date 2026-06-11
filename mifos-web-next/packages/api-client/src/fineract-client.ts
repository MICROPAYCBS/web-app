/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getFineractErrorMessage } from '@mifos/i18n';
import type { FineractApiError, FineractClientConfig } from './types';

function resolveNetworkErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return 'The server did not respond in time.';
    }
    if (error.message === 'fetch failed') {
      return 'Could not reach the server. Check that it is running and your network connection.';
    }
    if (error.message) {
      return `Could not reach the server (${error.message}).`;
    }
  }
  return 'Could not reach the server.';
}

export class FineractHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: FineractApiError | null
  ) {
    super(getFineractErrorMessage(body, status));
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
    const hasBody = options?.body !== undefined;
    const headers: Record<string, string> = {
      'Fineract-Platform-TenantId': this.config.tenantId
    };
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }
    if (auth) {
      headers['Authorization'] = auth;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: hasBody ? JSON.stringify(options.body) : undefined
      });
    } catch (error) {
      throw new FineractHttpError(0, { defaultUserMessage: resolveNetworkErrorMessage(error) });
    }

    let raw: string;
    try {
      raw = await res.text();
    } catch (error) {
      throw new FineractHttpError(0, { defaultUserMessage: resolveNetworkErrorMessage(error) });
    }

    if (!res.ok) {
      let body: FineractApiError | null = null;
      if (raw) {
        try {
          body = JSON.parse(raw) as FineractApiError;
        } catch {
          body = { defaultUserMessage: raw };
        }
      }
      throw new FineractHttpError(res.status, body);
    }

    if (res.status === 204 || !raw.trim()) {
      return undefined as T;
    }

    return JSON.parse(raw) as T;
  }

  get<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, { searchParams });
  }

  post<T>(path: string, body: unknown, searchParams?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', path, { body, searchParams });
  }

  put<T>(path: string, body: unknown, searchParams?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', path, { body, searchParams });
  }

  delete<T = void>(path: string, searchParams?: Record<string, string>): Promise<T> {
    // Fineract DELETE endpoints declare @Consumes(APPLICATION_JSON).
    return this.request<T>('DELETE', path, { body: {}, searchParams });
  }
}
