/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/composites/page-header';
import { platformInset, platformInsetX } from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

/** Fills the platform main area; only the detail body scrolls (sidebar + header stay put). */
const DETAIL_SIDEBAR_LAYOUT = 'flex min-h-0 flex-1 flex-col lg:flex-row';

export function DetailPage({
  header,
  summary,
  /** @deprecated Use `sidebar` — horizontal tabs under the header */
  tabs,
  /** Vertical secondary navigation (left rail) */
  sidebar,
  children,
  className
}: {
  header: ReactNode;
  summary?: ReactNode;
  tabs?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasSidebar = Boolean(sidebar);

  if (hasSidebar) {
    return (
      <div className={cn(DETAIL_SIDEBAR_LAYOUT, className)}>
        <aside
          className={cn(
            'max-h-[min(40vh,20rem)] w-full shrink-0 overflow-y-auto border-b border-border',
            'lg:max-h-none lg:w-56 lg:min-h-0 lg:self-stretch lg:border-b-0 lg:border-r xl:w-60'
          )}
        >
          <div className={cn(platformInset, 'lg:py-6')}>{sidebar}</div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PageHeader className="space-y-4 pt-1">
            {header}
            {summary}
          </PageHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className={cn(platformInset, 'space-y-6 lg:pl-8')}>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <PageHeader>
        <div className="space-y-4 pt-1">
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
