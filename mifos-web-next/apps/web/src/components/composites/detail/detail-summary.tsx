/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface DetailSummaryItem {
  id: string;
  label: string;
  value: ReactNode;
}

export function DetailSummary({
  items,
  className
}: {
  items: DetailSummaryItem[];
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {items.map((item) => (
        <Card key={item.id} size="sm">
          <CardContent className="space-y-1 pt-0">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <div className="text-base">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
