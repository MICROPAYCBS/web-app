import type { FineractServerProfile, ServerCatalog } from './types';

export function emptyCatalog(): ServerCatalog {
  return { servers: [], activeServerId: null };
}

export function getActiveServer(catalog: ServerCatalog): FineractServerProfile | null {
  if (!catalog.activeServerId) {
    return null;
  }
  return catalog.servers.find((s) => s.id === catalog.activeServerId) ?? null;
}

export function upsertServer(
  catalog: ServerCatalog,
  server: FineractServerProfile
): ServerCatalog {
  const idx = catalog.servers.findIndex((s) => s.id === server.id);
  const servers =
    idx >= 0
      ? catalog.servers.map((s) => (s.id === server.id ? server : s))
      : [...catalog.servers, server];
  return { ...catalog, servers };
}

export function removeServer(catalog: ServerCatalog, serverId: string): ServerCatalog {
  const servers = catalog.servers.filter((s) => s.id !== serverId);
  const activeServerId =
    catalog.activeServerId === serverId ? (servers[0]?.id ?? null) : catalog.activeServerId;
  return { servers, activeServerId };
}

export function setActiveServerId(catalog: ServerCatalog, serverId: string): ServerCatalog {
  if (!catalog.servers.some((s) => s.id === serverId)) {
    throw new Error('Unknown server id');
  }
  return { ...catalog, activeServerId: serverId };
}
