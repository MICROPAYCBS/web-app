/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatFineractDateArray } from '@/lib/fineract/dates';

export function formatCenterDate(value: string | number[] | undefined): string {
  if (value == null || value === '') {
    return '—';
  }
  if (Array.isArray(value)) {
    return formatFineractDateArray(value) ?? '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed);
}

export function centerStatusVariant(
  code?: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!code) {
    return 'secondary';
  }
  if (code.includes('active')) {
    return 'default';
  }
  if (code.includes('closed')) {
    return 'destructive';
  }
  return 'outline';
}
