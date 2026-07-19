/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DetailHeader({
  backLink,
  title,
  status,
  meta,
  actions,
  actionsClassName
}: {
  /** Placed above the title — use {@link DetailBackLink}. */
  backLink?: ReactNode;
  title: ReactNode;
  status?: { label: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive' };
  meta?: ReactNode;
  actions?: ReactNode;
  /** Applied to the actions container (e.g. `sm:self-end` to align with title meta). */
  actionsClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        {backLink ? <div>{backLink}</div> : null}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {status ? <Badge variant={status.variant ?? 'secondary'}>{status.label}</Badge> : null}
        </div>
        {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? (
        <div className={cn('flex shrink-0 items-center gap-2', actionsClassName)}>{actions}</div>
      ) : null}
    </div>
  );
}
