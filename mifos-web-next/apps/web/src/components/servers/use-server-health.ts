'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FineractServerProfile } from '@mifos/servers';
import type { ServerHealthSnapshot } from '@/components/servers/server-health-indicator';

type ProbePayload = {
  servers: Record<
    string,
    {
      state: 'healthy' | 'unhealthy';
      version?: string;
      message?: string;
    }
  >;
};

function probingMap(servers: FineractServerProfile[]): Record<string, ServerHealthSnapshot> {
  return Object.fromEntries(servers.map((s) => [s.id, { status: 'probing' as const }]));
}

function mapProbeResults(
  servers: FineractServerProfile[],
  data: ProbePayload
): Record<string, ServerHealthSnapshot> {
  return Object.fromEntries(
    servers.map((s) => {
      const probe = data.servers[s.id];
      if (!probe) {
        return [s.id, { status: 'unhealthy' as const, message: 'No probe result.' }];
      }
      if (probe.state === 'healthy') {
        return [
          s.id,
          {
            status: 'healthy' as const,
            version: probe.version,
            message: probe.message
          }
        ];
      }
      return [
        s.id,
        { status: 'unhealthy' as const, message: probe.message ?? 'Fineract unreachable' }
      ];
    })
  );
}

export function useServerHealth(servers: FineractServerProfile[], enabled: boolean) {
  const [healthById, setHealthById] = useState<Record<string, ServerHealthSnapshot>>({});
  const serversKey = servers.map((s) => `${s.id}:${s.baseUrl}`).join('|');
  const serversRef = useRef(servers);
  serversRef.current = servers;
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    const list = serversRef.current;
    if (list.length === 0) {
      setHealthById({});
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setHealthById(probingMap(list));

    try {
      const res = await fetch('/api/servers/health', {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!res.ok) {
        setHealthById(
          Object.fromEntries(
            list.map((s) => [
              s.id,
              { status: 'unhealthy' as const, message: 'Health check request failed.' }
            ])
          )
        );
        return;
      }

      const data = (await res.json()) as ProbePayload;
      setHealthById(mapProbeResults(list, data));
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setHealthById(
        Object.fromEntries(
          list.map((s) => [
            s.id,
            {
              status: 'unhealthy' as const,
              message: error instanceof Error ? error.message : 'Health check failed.'
            }
          ])
        )
      );
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      setHealthById((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    void refresh();
    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, serversKey, refresh]);

  const getHealth = useCallback(
    (serverId: string): ServerHealthSnapshot => healthById[serverId] ?? { status: 'idle' },
    [healthById]
  );

  return { getHealth, refresh, healthById };
}
