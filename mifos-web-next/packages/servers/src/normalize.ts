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

export function normalizeServerInput(input: UpsertServerInput): UpsertServerInput {
  return {
    name: input.name.trim(),
    baseUrl: normalizeBaseUrl(input.baseUrl),
    tenantId: input.tenantId.trim() || 'default'
  };
}

export function createServerId(): string {
  return `srv_${randomUUID()}`;
}
