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
  tabs,
  children,
  className
}: {
  header: ReactNode;
  summary?: ReactNode;
  /** Route-linked section tabs below the header */
  tabs?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader>
        <div className="space-y-4 pt-1">
          {header}
          {summary}
          {tabs}
        </div>
      </PageHeader>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
