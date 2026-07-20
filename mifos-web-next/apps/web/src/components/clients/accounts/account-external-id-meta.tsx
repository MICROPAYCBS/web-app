/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Hash } from 'lucide-react';
import { EmptyValue } from '@/components/composites/detail/empty-value';

/** Header meta line for account External ID (matches customer header pattern). */
export function AccountExternalIdMeta({
  externalId
}: {
  externalId?: string | null;
}) {
  const value = externalId?.trim();

  return (
    <span
      className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
      aria-label={value ? `External ID ${value}` : 'External ID not provided'}
    >
      <Hash className="size-4 shrink-0" aria-hidden />
      <span>
        External ID{' '}
        {value ? <span className="text-foreground tabular-nums">{value}</span> : <EmptyValue />}
      </span>
    </span>
  );
}
