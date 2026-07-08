import type { FineractServerProfile, ServerCatalog } from './types';
import type { UpsertServerInput } from './types';

function randomServerSuffix(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeBaseUrl(url: string): string {
  let value = url.trim();
  if (!value) {
    return value;
  }
  value = value.replace(/\/+$/, '');
  return value;
}

/**
 * Resolves a Fineract API base URL to `{origin}/fineract-provider/api/v1`.
 * Accepts the same shapes as the legacy Angular app (host-only, provider root, etc.).
 */
export function resolveFineractApiBaseUrl(url: string): string {
  const value = normalizeBaseUrl(url);
  if (!value) {
    return value;
  }

  if (/\/api\/v1$/i.test(value)) {
    return value;
  }

  // Legacy `apiProvider` without version: .../fineract-provider/api
  if (/\/fineract-provider\/api$/i.test(value)) {
    return `${value}/v1`;
  }

  if (/\/fineract-provider$/i.test(value)) {
    return `${value}/api/v1`;
  }

  // Host-only (legacy mifosXServerURL) — append standard Fineract path
  if (!/\/fineract-provider/i.test(value)) {
    return `${value}/fineract-provider/api/v1`;
  }

  return value;
}

export function normalizeServerProfile(server: FineractServerProfile): FineractServerProfile {
  return {
    ...server,
    baseUrl: resolveFineractApiBaseUrl(server.baseUrl),
    tenantId: server.tenantId?.trim() || 'default'
  };
}

export function normalizeCatalog(catalog: ServerCatalog): ServerCatalog {
  return {
    servers: catalog.servers.map(normalizeServerProfile),
    activeServerId: catalog.activeServerId
  };
}

export function normalizeServerInput(input: UpsertServerInput): UpsertServerInput {
  return {
    name: input.name.trim(),
    baseUrl: resolveFineractApiBaseUrl(input.baseUrl),
    tenantId: input.tenantId.trim() || 'default'
  };
}

export function createServerId(): string {
  return `srv_${randomServerSuffix()}`;
}
