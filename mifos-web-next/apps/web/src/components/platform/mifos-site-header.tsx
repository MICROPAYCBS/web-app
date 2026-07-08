'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Calendar, Home, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CashierHeaderBalance } from '@/components/platform/cashier-header-balance';
import { useEntitySearch } from '@/components/platform/entity-search-provider';
import { CheckerInboxHeaderLink } from '@/components/platform/checker-inbox-header-link';
import { NotificationsHeaderLink } from '@/components/platform/notifications-header-link';
import { isNavPathActive } from '@/components/platform/navigation-utils';
import type { CashierNavBalance } from '@/lib/fineract/cashier-display';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const headerChromeControlClass =
  'size-9 shrink-0 rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

/** dashboard-01 header — opens global entity search (⌘K / /). Sidebar Find uses F. */
export function MifosSiteHeader({
  businessDateLabel,
  businessDateIsNotToday = false,
  checkerInboxPendingCount,
  notificationsUnreadCount,
  cashierNavBalance
}: {
  businessDateLabel?: string | null;
  businessDateIsNotToday?: boolean;
  checkerInboxPendingCount?: number | null;
  notificationsUnreadCount?: number | null;
  cashierNavBalance?: CashierNavBalance | null;
}) {
  const pathname = usePathname();
  const { openEntitySearch } = useEntitySearch();
  const showBusinessDate = Boolean(businessDateLabel?.trim());
  const dashboardActive = isNavPathActive(pathname, '/');

  return (
    <header className="z-20 flex h-(--header-height) shrink-0 items-stretch border-b border-border bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex items-stretch border-r border-border">
        <div className="flex items-center px-2 sm:pl-3 sm:pr-2.5">
          <SidebarTrigger className={headerChromeControlClass} />
        </div>
        <div aria-hidden className="w-px shrink-0 self-stretch bg-border" />
        <div className="flex items-center px-2 sm:pr-3 sm:pl-2.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/"
                  aria-label="Dashboard"
                  aria-current={dashboardActive ? 'page' : undefined}
                  prefetch={!dashboardActive}
                  className={cn(
                    headerChromeControlClass,
                    'inline-flex items-center justify-center',
                    dashboardActive && 'bg-muted text-foreground'
                  )}
                />
              }
            >
              <Home className="size-4" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="bottom">Dashboard</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 lg:px-6">
        {showBusinessDate ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/system/business-date"
                  className={cn(
                    'inline-flex min-w-0 max-w-[min(100%,28rem)] items-center gap-2 rounded-md border px-2 py-1 text-sm transition-colors',
                    businessDateIsNotToday
                      ? 'border-warning/40 bg-warning/10 text-warning-foreground hover:bg-warning/15'
                      : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Calendar
                    className={cn(
                      'size-4 shrink-0',
                      businessDateIsNotToday ? 'text-warning' : 'opacity-60'
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'truncate font-medium',
                      !businessDateIsNotToday && 'text-foreground'
                    )}
                  >
                    {businessDateLabel}
                  </span>
                </Link>
              }
            />
            <TooltipContent side="bottom">
              {businessDateIsNotToday
                ? 'Organisation business date differs from today'
                : 'Organisation business date'}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {cashierNavBalance ? <CashierHeaderBalance balance={cashierNavBalance} /> : null}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <CheckerInboxHeaderLink initialCount={checkerInboxPendingCount} />
          <NotificationsHeaderLink initialCount={notificationsUnreadCount} />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
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
      </div>
    </header>
  );
}
