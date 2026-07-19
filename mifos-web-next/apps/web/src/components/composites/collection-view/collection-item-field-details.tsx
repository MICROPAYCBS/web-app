'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { CollectionDetailMode } from './collection-detail-mode';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export function CollectionItemFieldDetails({
  summary,
  detailMode,
  children
}: {
  summary: string;
  detailMode: CollectionDetailMode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(detailMode === 'fields');

  useEffect(() => {
    setOpen(detailMode === 'fields');
  }, [detailMode]);

  if (detailMode === 'fields') {
    return <div className="mt-1">{children}</div>;
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{summary}</p>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          className={cn(
            'flex items-center gap-1 text-sm font-medium text-primary hover:underline',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
          {open ? 'Hide field details' : 'Show field details'}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
      </Collapsible>
    </div>
  );
}
