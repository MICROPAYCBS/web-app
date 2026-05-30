'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Search } from 'lucide-react';
import { AppLink } from '@/components/routes/app-link';
import { useNavigation } from '@/components/platform/navigation-provider';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { UserMenu } from '@/components/platform/user-menu';
import { Kbd } from '@/components/ui/kbd';

export function PlatformHeader({ serverName }: { serverName?: string | null }) {
  const { openQuickFind } = useNavigation();

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">Mifos Web</h1>
          {serverName ? (
            <p className="truncate text-xs text-muted-foreground">
              {serverName} ·{' '}
              <AppLink
                route="settingsServers"
                className="underline-offset-4 hover:underline"
              >
                Server settings
              </AppLink>
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
      <button
        type="button"
        onClick={openQuickFind}
        className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70"
        aria-label="Open Quick Find"
      >
        <Search className="size-4 shrink-0 opacity-60" />
        <span className="flex-1">Quick Find…</span>
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
    </div>
  );
}
