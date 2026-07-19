/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatAmount, toDecimal } from '@mifos/domain';
import type { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';
import { EmptyValue } from '@/components/composites/detail/empty-value';

export function PercentValue({
  value,
  locale = 'en',
  className
}: {
  value: Decimal | string | number | null | undefined;
  locale?: string;
  className?: string;
}) {
  const decimal = toDecimal(value);
  if (!decimal) {
    return <EmptyValue />;
  }

  return (
    <span className={cn('tabular-nums', className)}>
      {formatAmount(decimal, locale)}%
    </span>
  );
}
