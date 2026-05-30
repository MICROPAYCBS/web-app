import 'server-only';

import type { FineractServerProfile, ServerCatalog } from '@mifos/servers';
import { emptyCatalog } from '@mifos/servers';

/** Seed catalog from FINERACT_SERVERS env (JSON array). */
export function getDefaultServersFromEnv(): FineractServerProfile[] {
  const raw = process.env.FINERACT_SERVERS;
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as FineractServerProfile[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (s) => s?.id && s?.name && s?.baseUrl && typeof s.tenantId === 'string'
    );
  } catch {
    console.warn('[servers] Invalid FINERACT_SERVERS JSON');
    return [];
  }
}

export function seedCatalog(catalog: ServerCatalog): ServerCatalog {
  if (catalog.servers.length > 0) {
    return catalog;
  }
  const defaults = getDefaultServersFromEnv();
  if (defaults.length === 0) {
    return catalog;
  }
  return {
    servers: defaults,
    activeServerId: defaults[0]?.id ?? null
  };
}

export function emptyOrSeededCatalog(): ServerCatalog {
  return seedCatalog(emptyCatalog());
}
