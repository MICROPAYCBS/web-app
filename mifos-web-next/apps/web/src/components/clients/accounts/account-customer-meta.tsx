/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { User } from 'lucide-react';

export function AccountCustomerMeta({ name }: { name?: string | null }) {
  const customerName = name?.trim();
  if (!customerName) {
    return null;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
      <User className="size-4 shrink-0" aria-hidden />
      <span>
        Customer <span className="text-foreground">{customerName}</span>
      </span>
    </span>
  );
}
