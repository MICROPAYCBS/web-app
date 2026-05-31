/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { EmptyValue } from '@/components/composites/detail/empty-value';

function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DateValue({
  value,
  locale = 'en',
  dateStyle = 'medium'
}: {
  value: string | Date | null | undefined;
  locale?: string;
  dateStyle?: 'short' | 'medium' | 'long';
}) {
  if (value == null || value === '') {
    return <EmptyValue />;
  }

  const date = value instanceof Date ? value : parseIsoDate(value);
  if (!date) {
    return <EmptyValue />;
  }

  return (
    <time dateTime={date.toISOString()}>
      {new Intl.DateTimeFormat(locale, { dateStyle }).format(date)}
    </time>
  );
}
