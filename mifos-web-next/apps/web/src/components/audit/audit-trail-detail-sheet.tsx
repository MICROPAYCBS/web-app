'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail } from '@mifos/api-client';
import { Loader2 } from 'lucide-react';
import { AuditTrailDetailContent } from '@/components/audit/audit-trail-detail-content';
import { DOCKED_SHEET_LAYOUT_CLASSNAME } from '@/components/composites/form-sheet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { formatAuditTrailFilterLabel } from '@/lib/fineract/audit-trail-display';
import { cn } from '@/lib/utils';

export function AuditTrailDetailSheet({
  open,
  onOpenChange,
  audit,
  previousCommandAsJson,
  loading = false,
  error
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: FineractAuditTrailDetail | null;
  previousCommandAsJson?: string;
  loading?: boolean;
  error?: string | null;
}) {
  const actionLabel = audit?.actionName
    ? formatAuditTrailFilterLabel(audit.actionName)
    : undefined;
  const entityLabel = audit?.entityName
    ? formatAuditTrailFilterLabel(audit.entityName)
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(
          DOCKED_SHEET_LAYOUT_CLASSNAME,
          'data-[side=right]:w-full data-[side=right]:sm:max-w-xl'
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>
            {audit ? `Audit trail ${audit.id}` : loading ? 'Loading audit trail…' : 'Audit trail'}
          </SheetTitle>
          <SheetDescription>
            {actionLabel && entityLabel
              ? `${actionLabel} on ${entityLabel}`
              : 'Review who changed what and when.'}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading audit details…
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : audit ? (
            <AuditTrailDetailContent
              audit={audit}
              previousCommandAsJson={previousCommandAsJson}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Select an audit entry to view details.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
