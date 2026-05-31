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

export function ListPage({
  title,
  description,
  actions,
  toolbar,
  children,
  className
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 pt-1">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
          {toolbar ? <div>{toolbar}</div> : null}
        </div>
      </PageHeader>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
