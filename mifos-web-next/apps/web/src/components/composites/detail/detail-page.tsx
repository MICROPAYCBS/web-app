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
  detailSidebarGridAreaHeader,
  detailSidebarGridAreaMain,
  detailSidebarGridAreaNav,
  detailSidebarInsetX,
  detailSidebarScrollPadding,
  pageHeaderContentSpacing,
  platformDetailSidebarGridLayout,
  platformInset,
  platformPageShell
} from '@/lib/platform-layout';
import { cn } from '@/lib/utils';

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
      <div className={cn(platformDetailSidebarGridLayout, className)}>
        <PageHeader className={cn(detailSidebarGridAreaHeader, headerClassName)}>
          <div className={pageHeaderContentSpacing}>
            {header}
            {summary}
          </div>
        </PageHeader>
        <aside
          className={cn(
            detailSidebarGridAreaNav,
            'flex min-h-0 w-full flex-col border-border',
            'max-h-[min(40vh,20rem)] border-b lg:max-h-none lg:border-b-0 lg:border-r'
          )}
        >
          <div
            className={cn(
              detailSidebarInsetX,
              detailSidebarScrollPadding,
              'min-h-0 flex-1 overflow-y-auto overscroll-contain'
            )}
          >
            {sidebar}
          </div>
        </aside>
        <div
          className={cn(
            detailSidebarGridAreaMain,
            'flex min-h-0 min-w-0 flex-col overflow-hidden'
          )}
        >
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
