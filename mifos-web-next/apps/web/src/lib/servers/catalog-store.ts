import 'server-only';

import { cookies } from 'next/headers';
import type { FineractServerProfile, ServerCatalog } from '@mifos/servers';
import {
  emptyCatalog,
  getActiveServer,
  removeServer,
  setActiveServerId,
  upsertServer
} from '@mifos/servers';
import { createServerId, normalizeCatalog, normalizeServerInput } from '@mifos/servers';
import type { UpsertServerInput } from '@mifos/servers';
import { SERVER_CATALOG_COOKIE } from './constants';
import { seedCatalog } from './defaults';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

async function readRawCatalog(): Promise<ServerCatalog> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SERVER_CATALOG_COOKIE)?.value;
  if (!raw) {
    return seedCatalog(emptyCatalog());
  }
  try {
    const parsed = JSON.parse(raw) as ServerCatalog;
    if (!parsed?.servers || !Array.isArray(parsed.servers)) {
      return seedCatalog(emptyCatalog());
    }
    return normalizeCatalog({
      servers: parsed.servers,
      activeServerId: parsed.activeServerId ?? null
    });
  } catch {
    return seedCatalog(emptyCatalog());
  }
}

async function writeCatalog(catalog: ServerCatalog): Promise<void> {
  catalog = normalizeCatalog(catalog);
  const cookieStore = await cookies();
  cookieStore.set(SERVER_CATALOG_COOKIE, JSON.stringify(catalog), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production'
  });
}

export async function getServerCatalog(): Promise<ServerCatalog> {
  return readRawCatalog();
}

export async function getActiveFineractServer(): Promise<FineractServerProfile | null> {
  return getActiveServer(await readRawCatalog());
}

export async function hasActiveServer(): Promise<boolean> {
  return (await getActiveFineractServer()) !== null;
}

export async function selectFineractServer(serverId: string): Promise<ServerCatalog> {
  const next = setActiveServerId(await readRawCatalog(), serverId);
  await writeCatalog(next);
  return next;
}

export async function addFineractServer(input: UpsertServerInput): Promise<ServerCatalog> {
  const normalized = normalizeServerInput(input);
  const server: FineractServerProfile = {
    id: createServerId(),
    ...normalized
  };
  let catalog = upsertServer(await readRawCatalog(), server);
  if (!catalog.activeServerId) {
    catalog = setActiveServerId(catalog, server.id);
  }
  await writeCatalog(catalog);
  return catalog;
}

export async function updateFineractServer(
  serverId: string,
  input: UpsertServerInput
): Promise<ServerCatalog> {
  const catalog = await readRawCatalog();
  const existing = catalog.servers.find((s) => s.id === serverId);
  if (!existing) {
    throw new Error('Server not found');
  }
  const normalized = normalizeServerInput(input);
  const next = upsertServer(catalog, { id: serverId, ...normalized });
  await writeCatalog(next);
  return next;
}

export async function deleteFineractServer(serverId: string): Promise<ServerCatalog> {
  const next = removeServer(await readRawCatalog(), serverId);
  await writeCatalog(next);
  return next;
}
