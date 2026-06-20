import 'server-only';

import {
  actuatorHealthUrl,
  actuatorInfoUrl,
  getFineractProviderRoot
} from '@/lib/fineract/actuator-url';
import { fineractFetch } from '@/lib/fineract/fineract-fetch';

const PROBE_TIMEOUT_MS = 10_000;

export type FineractHealthState = 'healthy' | 'unhealthy';

export interface FineractProbeResult {
  state: FineractHealthState;
  /** Fineract build version from `/actuator/info` when healthy */
  version?: string;
  message?: string;
}

interface ActuatorHealthResponse {
  status?: string;
}

interface ActuatorInfoResponse {
  build?: { version?: string };
  git?: { build?: { version?: string } };
}

function readVersion(info: ActuatorInfoResponse): string | undefined {
  return info.build?.version ?? info.git?.build?.version;
}

/**
 * Probes Fineract via Spring Actuator (BFF-only — never from the browser).
 * @see https://github.com/apache/fineract — `/fineract-provider/actuator/health` and `/actuator/info`
 */
export async function probeFineractServer(apiBaseUrl: string): Promise<FineractProbeResult> {
  const root = getFineractProviderRoot(apiBaseUrl);

  try {
    const healthRes = await fineractFetch(actuatorHealthUrl(root), {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS)
    });

    let healthBody: ActuatorHealthResponse | null = null;
    try {
      healthBody = (await healthRes.json()) as ActuatorHealthResponse;
    } catch {
      healthBody = null;
    }

    if (!healthRes.ok || healthBody?.status !== 'UP') {
      return {
        state: 'unhealthy',
        message:
          healthBody?.status && healthBody.status !== 'UP'
            ? `Health status: ${healthBody.status}`
            : `Health check failed (HTTP ${healthRes.status}).`
      };
    }

    const infoRes = await fineractFetch(actuatorInfoUrl(root), {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS)
    });

    if (!infoRes.ok) {
      return {
        state: 'healthy',
        message: 'Health is UP; version info was not available.'
      };
    }

    const info = (await infoRes.json()) as ActuatorInfoResponse;
    const version = readVersion(info);

    return {
      state: 'healthy',
      version: version ?? undefined,
      message: version ? undefined : 'Health is UP; version not reported.'
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'TimeoutError'
        ? 'The server did not respond in time.'
        : error instanceof Error
          ? error.message
          : 'Could not reach the server.';
    return { state: 'unhealthy', message };
  }
}
