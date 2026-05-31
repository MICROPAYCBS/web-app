/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /** Short headline (e.g. "No addresses yet"). */
  title: string;
  /** Supporting copy; keep to one or two lines. */
  description?: string;
  /** Optional icon above the title. */
  icon?: LucideIcon;
  /** Primary CTA (e.g. Add button) shown below description. */
  action?: ReactNode;
  /** `default` — dashed card for detail/wizard lists; `compact` — minimal padding for tables. */
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Consistent empty list / no-results UI (see COMPONENTS.md — DataTableEmpty).
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  variant = 'default',
  className
}: EmptyStateProps) {
  const compact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 rounded-lg border border-dashed px-6 py-10',
        className
      )}
      role="status"
    >
      {Icon ? (
        <Icon className={cn('text-muted-foreground', compact ? 'size-8' : 'size-10')} aria-hidden />
      ) : null}
      <div className="space-y-1">
        <p className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>
          {title}
        </p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
