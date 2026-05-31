/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatMoney, toDecimal } from '@mifos/domain';
import type { Decimal } from 'decimal.js';
import { cn } from '@/lib/utils';
import { EmptyValue } from '@/components/composites/detail/empty-value';

export function MoneyValue({
  amount,
  currencyCode,
  locale = 'en',
  className,
  emphasize = false
}: {
  amount: Decimal | string | number | null | undefined;
  currencyCode: string;
  locale?: string;
  className?: string;
  /** Use on summary KPI figures only (ADR-013). */
  emphasize?: boolean;
}) {
  const decimal = toDecimal(amount);
  if (!decimal) {
    return <EmptyValue />;
  }
  const formatted = formatMoney(decimal, currencyCode, locale);
  if (!formatted) {
    return <EmptyValue />;
  }

  return (
    <span
      className={cn(
        'tabular-nums',
        emphasize ? 'font-semibold' : 'font-normal',
        className
      )}
    >
      {formatted}
    </span>
  );
}
