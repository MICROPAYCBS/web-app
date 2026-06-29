/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const DEFAULT_IDLE_TIMEOUT_MINUTES = 15;
const DEFAULT_IDLE_WARNING_SECONDS = 60;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function resolvePositiveInt(
  sessionValue: number | undefined,
  envValue: string | undefined,
  fallback: number
): number {
  if (
    sessionValue !== undefined &&
    Number.isFinite(sessionValue) &&
    sessionValue >= 0
  ) {
    return sessionValue;
  }
  return parsePositiveInt(envValue, fallback);
}

export interface SessionIdlePolicy {
  sessionIdleTimeoutMinutes?: number;
  sessionIdleWarningSeconds?: number;
}

export interface InactivityTimeoutConfig {
  /** When false, idle logout is disabled (timeout minutes is 0). */
  enabled: boolean;
  timeoutMs: number;
  warningMs: number;
  warningSeconds: number;
}

/** Client-readable idle session settings (see docs/AUTH.md). */
export function getInactivityTimeoutConfig(
  env: NodeJS.ProcessEnv = process.env,
  sessionPolicy?: SessionIdlePolicy
): InactivityTimeoutConfig {
  const timeoutMinutes = resolvePositiveInt(
    sessionPolicy?.sessionIdleTimeoutMinutes,
    env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES,
    DEFAULT_IDLE_TIMEOUT_MINUTES
  );
  const warningSeconds = resolvePositiveInt(
    sessionPolicy?.sessionIdleWarningSeconds,
    env.NEXT_PUBLIC_SESSION_IDLE_WARNING_SECONDS,
    DEFAULT_IDLE_WARNING_SECONDS
  );

  if (timeoutMinutes === 0) {
    return {
      enabled: false,
      timeoutMs: 0,
      warningMs: 0,
      warningSeconds: 0
    };
  }

  return {
    enabled: true,
    timeoutMs: timeoutMinutes * 60 * 1000,
    warningMs: warningSeconds * 1000,
    warningSeconds
  };
}
