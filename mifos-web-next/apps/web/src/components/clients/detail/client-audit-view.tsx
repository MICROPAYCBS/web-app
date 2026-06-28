'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import { ChevronDown, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/composites';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { AuditTrailCommandFields } from '@/components/system/audit-trail-command-fields';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';
import { cn } from '@/lib/utils';

function auditTrailDetailPath(auditId: number): string {
  return `/system/audit-trails/${auditId}`;
}

function auditResultVariant(
  result: string | undefined
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!result) {
    return 'outline';
  }
  const normalized = result.toLowerCase();
  if (normalized.includes('success') || normalized.includes('processed')) {
    return 'default';
  }
  if (normalized.includes('fail') || normalized.includes('reject')) {
    return 'destructive';
  }
  return 'secondary';
}

function ClientAuditEntry({
  audit,
  defaultOpen = false
}: {
  audit: FineractAuditTrailListItem;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const actionLabel = audit.actionName
    ? formatAuditTrailFilterLabel(audit.actionName)
    : 'Change';
  const entityLabel = audit.entityName
    ? formatAuditTrailFilterLabel(audit.entityName)
    : 'Record';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-start gap-3 px-4 py-3 text-left',
            'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <ChevronDown
            className={cn('mt-0.5 size-4 shrink-0 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">
                {actionLabel} · {entityLabel}
              </p>
              {audit.processingResult ? (
                <Badge variant={auditResultVariant(audit.processingResult)}>
                  {formatAuditTrailFilterLabel(audit.processingResult)}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatAuditTrailDateTime(audit.madeOnDate)}
              {audit.maker ? ` · ${audit.maker}` : ''}
            </p>
          </div>
          <Link
            href={auditTrailDetailPath(audit.id)}
            className="shrink-0 text-sm tabular-nums text-primary underline-offset-4 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            #{audit.id}
          </Link>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border px-4 py-4">
          <div className="space-y-6">
            <DetailFieldGrid columns={2}>
              <DetailField label="Audit ID">
                <Link
                  href={auditTrailDetailPath(audit.id)}
                  className="tabular-nums text-primary underline-offset-4 hover:underline"
                >
                  {audit.id}
                </Link>
              </DetailField>
              <DetailField label="Made on">
                {formatAuditTrailDateTime(audit.madeOnDate)}
              </DetailField>
              <DetailField label="User">{audit.maker ?? '—'}</DetailField>
              <DetailField label="Action">{actionLabel}</DetailField>
              <DetailField label="Entity">{entityLabel}</DetailField>
              <DetailField label="Result">
                {audit.processingResult
                  ? formatAuditTrailFilterLabel(audit.processingResult)
                  : '—'}
              </DetailField>
              {audit.resourceId != null ? (
                <DetailField label="Resource ID">{audit.resourceId}</DetailField>
              ) : null}
              {audit.officeName ? (
                <DetailField label="Office">{audit.officeName}</DetailField>
              ) : null}
              {audit.checker ? <DetailField label="Checker">{audit.checker}</DetailField> : null}
              {audit.checkedOnDate ? (
                <DetailField label="Checked on">
                  {formatAuditTrailDateTime(audit.checkedOnDate)}
                </DetailField>
              ) : null}
              {audit.ip ? <DetailField label="Client IP">{audit.ip}</DetailField> : null}
            </DetailFieldGrid>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Changed fields</h3>
              <AuditTrailCommandFields commandAsJson={audit.commandAsJson} />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ClientAuditView({
  audits,
  loadFailed = false,
  totalRecords
}: {
  audits: FineractAuditTrailListItem[];
  loadFailed?: boolean;
  totalRecords?: number;
}) {
  if (loadFailed) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Audit trail unavailable"
        description="Audit entries could not be loaded for this customer."
      />
    );
  }

  if (audits.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No audit entries"
        description="No audit trail entries were found for this customer."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing {audits.length}
        {totalRecords != null && totalRecords > audits.length
          ? ` of ${totalRecords}`
          : ''}{' '}
        audit {audits.length === 1 ? 'entry' : 'entries'}. Expand an entry to see all fields
        involved in the change.
      </p>
      <div className="space-y-3">
        {audits.map((audit, index) => (
          <ClientAuditEntry key={audit.id} audit={audit} defaultOpen={index === 0} />
        ))}
      </div>
    </div>
  );
}
