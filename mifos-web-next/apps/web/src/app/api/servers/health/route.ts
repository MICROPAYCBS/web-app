import { NextResponse } from 'next/server';
import { probeFineractServer } from '@/lib/fineract/probe-server';
import { getServerCatalog } from '@/lib/servers/catalog-store';

export const dynamic = 'force-dynamic';

/** BFF: probe actuator health/info for each configured Fineract server. */
export async function GET() {
  const catalog = await getServerCatalog();
  const entries = await Promise.all(
    catalog.servers.map(async (server) => {
      const probe = await probeFineractServer(server.baseUrl);
      return [
        server.id,
        {
          state: probe.state,
          version: probe.version,
          release: probe.release,
          commit: probe.commit,
          message: probe.message
        }
      ] as const;
    })
  );

  return NextResponse.json({ servers: Object.fromEntries(entries) });
}
