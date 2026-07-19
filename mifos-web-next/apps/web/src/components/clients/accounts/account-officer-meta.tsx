/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UserRound } from 'lucide-react';

export function AccountOfficerMeta({
  label,
  name
}: {
  label: string;
  name?: string | null;
}) {
  const officerName = name?.trim();

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
      <UserRound className="size-4 shrink-0" aria-hidden />
      <span>
        {label}{' '}
        <span className="text-foreground">{officerName || 'Unassigned'}</span>
      </span>
    </span>
  );
}
