'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { cn } from '@/lib/utils';

export type ServerHealthUiStatus = 'probing' | 'healthy' | 'unhealthy' | 'idle';

export interface ServerHealthSnapshot {
  status: ServerHealthUiStatus;
  /** Formatted `release+commit` label when available. */
  version?: string;
  release?: string;
  commit?: string;
  message?: string;
}

const LIGHT_CLASS: Record<Exclude<ServerHealthUiStatus, 'idle'>, string> = {
  probing: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)] animate-pulse',
  healthy: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
  unhealthy: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
};

export function getServerHealthLabel(health: ServerHealthSnapshot): string | null {
  switch (health.status) {
    case 'probing':
      return 'Checking server…';
    case 'healthy':
      return health.version ? `Connected · v${health.version}` : 'Server is healthy';
    case 'unhealthy':
      return health.message ?? 'Server unreachable';
    default:
      return null;
  }
}

export const SERVER_STATUS_LIGHT_CLASS = LIGHT_CLASS;

export function ServerHealthIndicator({
  health,
  className
}: {
  health: ServerHealthSnapshot;
  className?: string;
}) {
  if (health.status === 'idle') {
    return null;
  }

  const label = getServerHealthLabel(health);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn('size-2.5 shrink-0 rounded-full', LIGHT_CLASS[health.status])}
        role="status"
        aria-label={label ?? undefined}
      />
      <span className="text-xs text-muted-foreground">{label ?? ''}</span>
    </div>
  );
}
