'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChevronRightIcon, ServerIcon } from 'lucide-react';

/** Opens server management — shown when no Fineract server is active. */
export function LoginNoServerEmpty({ onManageServers }: { onManageServers: () => void }) {
  return (
    <button
      type="button"
      onClick={onManageServers}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-4 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 items-center gap-3">
        <ServerIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          <span className="block font-medium text-foreground">Connect to a server</span>
          <span className="block text-xs text-muted-foreground">
            Choose your environment before signing in.
          </span>
        </span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
