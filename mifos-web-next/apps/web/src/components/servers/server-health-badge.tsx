'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  getServerHealthLabel,
  type ServerHealthSnapshot
} from '@/components/servers/server-health-indicator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function badgeLabel(health: ServerHealthSnapshot): string {
  switch (health.status) {
    case 'probing':
      return 'Checking…';
    case 'healthy':
      return health.version ? `API v${health.version}` : 'Connected';
    case 'unhealthy':
      return 'Unreachable';
    default:
      return '';
  }
}

export function ServerHealthBadge({
  health,
  className
}: {
  health?: ServerHealthSnapshot;
  className?: string;
}) {
  if (!health || health.status === 'idle') {
    return null;
  }

  const label = badgeLabel(health);
  const fullLabel = getServerHealthLabel(health);

  const variantClass =
    health.status === 'probing'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300'
      : health.status === 'healthy'
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
        : 'border-destructive/40 bg-destructive/10 text-destructive';

  return (
    <Badge
      variant="outline"
      className={cn('shrink-0', variantClass, className)}
      title={fullLabel ?? undefined}
    >
      {label}
    </Badge>
  );
}
