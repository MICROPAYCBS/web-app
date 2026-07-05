/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/composites/page-header';
import {
  detailSidebarInsetX,
  pageHeaderContentSpacing,
  platformInset,
  platformPageShell,
  platformSidebarRowLayout
} from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

/** Fills the platform main area; only the detail body scrolls (sidebar + header stay put). */
const DETAIL_SIDEBAR_LAYOUT = cn(platformSidebarRowLayout);

export function DetailPage({
  header,
  summary,
  /** @deprecated Use `sidebar` — horizontal tabs under the header */
  tabs,
  /** Vertical secondary navigation (left rail) */
  sidebar,
  children,
  className,
  headerClassName
}: {
  header: ReactNode;
  summary?: ReactNode;
  tabs?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Optional extra classes on the fixed header region. */
  headerClassName?: string;
}) {
  const hasSidebar = Boolean(sidebar);
  const headerContentClassName = cn(pageHeaderContentSpacing, headerClassName);

  if (hasSidebar) {
    return (
      <div className={cn(DETAIL_SIDEBAR_LAYOUT, className)}>
        <aside
          className={cn(
            'flex w-full shrink-0 flex-col border-border',
            'max-h-[min(40vh,20rem)] border-b lg:max-h-none lg:w-56 lg:min-h-0 lg:self-stretch lg:border-b-0 lg:border-r xl:w-60'
          )}
        >
          <div
            className={cn(
              detailSidebarInsetX,
              'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 md:pb-6'
            )}
          >
            {sidebar}
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PageHeader className={headerClassName}>
            <div className={pageHeaderContentSpacing}>
              {header}
              {summary}
            </div>
          </PageHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className={cn(platformInset, 'space-y-6 lg:pl-8')}>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(platformPageShell, className)}>
      <PageHeader>
        <div className={headerContentClassName}>
          {header}
          {summary}
          {tabs}
        </div>
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={cn(platformInset, 'space-y-6')}>{children}</div>
      </div>
    </div>
  );
}
