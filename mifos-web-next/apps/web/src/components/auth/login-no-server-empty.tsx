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
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ServerIcon className="size-5 text-muted-foreground" aria-hidden />
      Choose a server
      <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
    </button>
  );
}
