import 'server-only';

import {
  actuatorHealthUrl,
  actuatorInfoUrl,
  getFineractProviderRoot
} from '@/lib/fineract/actuator-url';
import {
  formatFineractBuildVersionLabel,
  resolveFineractBuildVersion,
  type FineractActuatorInfo,
  type FineractBuildVersion
} from '@/lib/fineract/fineract-build-version';
import { fineractFetch } from '@/lib/fineract/fineract-fetch';

const PROBE_TIMEOUT_MS = 10_000;

export type FineractHealthState = 'healthy' | 'unhealthy';

export interface FineractProbeResult {
  state: FineractHealthState;
  /** Formatted `release+commit` label for compact UI. */
  version?: string;
  release?: string;
  commit?: string;
  message?: string;
}

interface ActuatorHealthResponse {
  status?: string;
}

function probeResultFromBuild(
  build: FineractBuildVersion | null,
  message?: string
): Pick<FineractProbeResult, 'version' | 'release' | 'commit' | 'message'> {
  if (!build) {
    return { message };
  }
  return {
    version: formatFineractBuildVersionLabel(build),
    release: build.release,
    commit: build.commit,
    message
  };
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

    let build: FineractBuildVersion | null = null;
    try {
      const info = (await infoRes.json()) as FineractActuatorInfo;
      build = resolveFineractBuildVersion(info);
    } catch {
      build = null;
    }

    return {
      state: 'healthy',
      ...probeResultFromBuild(
        build,
        build ? undefined : 'Health is UP; version not reported.'
      )
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
