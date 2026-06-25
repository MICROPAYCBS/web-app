'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { useEntitySearch } from '@/components/platform/entity-search-provider';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** dashboard-01 header — opens global entity search (⌘K / /). Sidebar Find uses F. */
export function MifosSiteHeader({ businessDateLabel }: { businessDateLabel?: string | null }) {
  const { openEntitySearch } = useEntitySearch();
  const showBusinessDate = Boolean(businessDateLabel?.trim());

  return (
    <header className="z-20 flex h-(--header-height) shrink-0 items-stretch border-b border-border bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex items-center border-r border-border px-2 sm:px-3">
        <SidebarTrigger className="-ml-0.5" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 lg:px-6">
        {showBusinessDate ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/system/business-date"
                  className="inline-flex min-w-0 max-w-[min(100%,28rem)] items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Calendar className="size-4 shrink-0" aria-hidden />
                  <span className="truncate font-medium text-foreground">{businessDateLabel}</span>
                </Link>
              }
            />
            <TooltipContent side="bottom">Organisation business date</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto shrink-0"
                onClick={openEntitySearch}
                aria-label="Search records"
              />
            }
          >
            <Search className="size-4" aria-hidden />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-1.5">
            Search customers, accounts, groups…
            <span className="inline-flex items-center gap-0.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
