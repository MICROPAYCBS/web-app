'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { FieldHintTooltip } from '@/components/composites/field-hint-tooltip';
import { cn } from '@/lib/utils';

export function DetailField({
  label,
  children,
  hint,
  hintAriaLabel,
  valueClassName,
  className
}: {
  label: string;
  children: ReactNode;
  /** Longer help text shown in a tooltip beside the label. */
  hint?: string;
  hintAriaLabel?: string;
  /** Applied to the value cell (e.g. `text-right` for money columns). */
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {label}
        {hint ? <FieldHintTooltip content={hint} ariaLabel={hintAriaLabel} /> : null}
      </dt>
      <dd className={cn('text-sm text-foreground', valueClassName)}>{children}</dd>
    </div>
  );
}
