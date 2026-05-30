import { randomUUID } from 'node:crypto';

import type { UpsertServerInput } from './types';

export function normalizeBaseUrl(url: string): string {
  let value = url.trim();
  if (!value) {
    return value;
  }
  value = value.replace(/\/+$/, '');
  return value;
}

/**
 * Ensures the Fineract REST API base ends with `/api/v1`.
 * Health probes use the provider root; auth requires the API v1 path.
 */
export function resolveFineractApiBaseUrl(url: string): string {
  const value = normalizeBaseUrl(url);
  if (!value) {
    return value;
  }
  if (/\/api\/v1$/i.test(value)) {
    return value;
  }
  if (/\/fineract-provider$/i.test(value)) {
    return `${value}/api/v1`;
  }
  return value;
}

export function normalizeServerInput(input: UpsertServerInput): UpsertServerInput {
  return {
    name: input.name.trim(),
    baseUrl: resolveFineractApiBaseUrl(input.baseUrl),
    tenantId: input.tenantId.trim() || 'default'
  };
}

export function createServerId(): string {
  return `srv_${randomUUID()}`;
}
