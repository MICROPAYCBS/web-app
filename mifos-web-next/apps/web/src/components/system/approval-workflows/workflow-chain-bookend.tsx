'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Badge } from '@/components/ui/badge';
import {
  workflowChainBookend,
  type WorkflowChainBookendPosition
} from '@/lib/fineract/approval-workflow-display';
import { cn } from '@/lib/utils';

export function WorkflowChainConnector({ label = 'Automatic' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-2 pl-6 text-xs text-muted-foreground">
      <span className="inline-block h-4 border-l border-dashed border-border" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function WorkflowChainBookend({
  position,
  stepNumber,
  connectorBelow = false,
  className
}: {
  position: WorkflowChainBookendPosition;
  stepNumber?: number;
  connectorBelow?: boolean;
  className?: string;
}) {
  const bookend = workflowChainBookend(position);

  return (
    <div className={className}>
      <div
        className={cn(
          'relative rounded-lg border border-dashed border-border bg-muted/20 p-4',
          stepNumber != null && 'border-l-2 border-l-primary/30 pl-6'
        )}
      >
        {stepNumber != null ? (
          <div className="absolute -left-[9px] top-4 flex size-4 items-center justify-center rounded-full border-2 border-primary bg-background text-[10px] font-semibold text-primary">
            {stepNumber}
          </div>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium">{bookend.title}</p>
            <p className="text-sm text-muted-foreground">{bookend.subtitle}</p>
          </div>
          <Badge variant="secondary">System</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{bookend.description}</p>
      </div>
      {connectorBelow ? <WorkflowChainConnector /> : null}
    </div>
  );
}
