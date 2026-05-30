'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ServerIcon } from 'lucide-react';

/** Shown in place of username/password when no Fineract server is active. */
export function LoginNoServerEmpty() {
  return (
    <div
      className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center"
      role="status"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <ServerIcon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold">No Fineract server selected</h2>
      <p className="mt-2 max-w-sm text-sm text-balance text-muted-foreground">
        Add or choose a backend below before signing in. Your credentials are sent to Fineract
        through this app&apos;s server only.
      </p>
    </div>
  );
}
