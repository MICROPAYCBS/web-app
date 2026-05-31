'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Search } from 'lucide-react';
import { useNavigation } from '@/components/platform/navigation-provider';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

/** dashboard-01 header — focuses sidebar navigation Find (⌘K / F). */
export function MifosSiteHeader() {
  const { focusNavFind } = useNavigation();

  return (
    <header className="z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full flex-wrap items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />
        <button
          type="button"
          onClick={focusNavFind}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70 sm:max-w-md"
          aria-label="Focus navigation find"
        >
          <Search className="size-4 shrink-0 opacity-60" />
          <span className="flex-1 truncate">Find navigation…</span>
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>
    </header>
  );
}
