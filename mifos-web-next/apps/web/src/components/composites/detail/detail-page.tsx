/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/composites/page-header';
import { cn } from '@/lib/utils';

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

  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader>
        <div className="space-y-4 pt-1">
          {header}
          {summary}
          {!hasSidebar ? tabs : null}
        </div>
      </PageHeader>

      {hasSidebar ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0">
          <aside
            className={cn(
              'w-full shrink-0 border-b border-border pb-6 lg:sticky lg:top-24 lg:z-10 lg:bg-background lg:w-56 lg:self-start lg:border-r lg:border-b-0 lg:pb-0 lg:pr-6 xl:w-60'
            )}
          >
            {sidebar}
          </aside>
          <div className="min-w-0 flex-1 space-y-6 lg:pl-8">{children}</div>
        </div>
      ) : (
        <div className="space-y-6">{children}</div>
      )}
    </div>
  );
}
