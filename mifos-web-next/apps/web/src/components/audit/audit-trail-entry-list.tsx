'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import { ChevronRight } from 'lucide-react';
import { useAuditTrailPanel } from '@/components/audit/audit-trail-panel';
import { Badge } from '@/components/ui/badge';
import {
  auditTrailResultVariant,
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';
import { cn } from '@/lib/utils';

export function AuditTrailEntryList({
  audits,
  className
}: {
  audits: FineractAuditTrailListItem[];
  className?: string;
}) {
  const { canView, openAuditTrail } = useAuditTrailPanel();

  return (
    <div className={cn('divide-y divide-border rounded-lg border border-border bg-card', className)}>
      {audits.map((audit) => {
        const actionLabel = audit.actionName
          ? formatAuditTrailFilterLabel(audit.actionName)
          : 'Change';
        const entityLabel = audit.entityName
          ? formatAuditTrailFilterLabel(audit.entityName)
          : 'Record';

        return (
          <div key={audit.id} className="flex items-stretch">
            {canView ? (
              <button
                type="button"
                className={cn(
                  'flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left',
                  'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                )}
                onClick={() => openAuditTrail(audit)}
              >
                <AuditTrailEntrySummary
                  audit={audit}
                  actionLabel={actionLabel}
                  entityLabel={entityLabel}
                />
              </button>
            ) : (
              <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3">
                <AuditTrailEntrySummary
                  audit={audit}
                  actionLabel={actionLabel}
                  entityLabel={entityLabel}
                />
              </div>
            )}
            {canView ? (
              <button
                type="button"
                aria-label={`View audit trail ${audit.id}`}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 border-l border-border px-4 py-3 text-sm tabular-nums text-primary',
                  'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                )}
                onClick={() => openAuditTrail(audit)}
              >
                #{audit.id}
                <ChevronRight className="size-4 opacity-60" aria-hidden />
              </button>
            ) : (
              <div className="inline-flex shrink-0 items-center border-l border-border px-4 py-3 text-sm tabular-nums text-muted-foreground">
                #{audit.id}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AuditTrailEntrySummary({
  audit,
  actionLabel,
  entityLabel
}: {
  audit: FineractAuditTrailListItem;
  actionLabel: string;
  entityLabel: string;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {actionLabel} · {entityLabel}
        </p>
        {audit.processingResult ? (
          <Badge variant={auditTrailResultVariant(audit.processingResult)}>
            {formatAuditTrailFilterLabel(audit.processingResult)}
          </Badge>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {formatAuditTrailDateTime(audit.madeOnDate)}
        {audit.maker ? ` · ${audit.maker}` : ''}
      </p>
    </div>
  );
}
