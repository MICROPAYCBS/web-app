'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import {
  AuditTrailEntryList,
  AuditTrailOpenButton,
  useAuditTrailPanel
} from '@/components/audit';
import { DetailField, DetailFieldGrid, DetailSection } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { formatAuditTrailDateTime, formatAuditTrailFilterLabel } from '@/lib/fineract/audit-trail-display';

function AuditTrailSummary({ audit }: { audit: FineractAuditTrailListItem }) {
  const { canView, openAuditTrail } = useAuditTrailPanel();

  return (
    <div className="space-y-4">
      <DetailFieldGrid>
        <DetailField label="Audit ID">
          <AuditTrailOpenButton audit={audit} />
        </DetailField>
        <DetailField label="Made on">{formatAuditTrailDateTime(audit.madeOnDate)}</DetailField>
        <DetailField label="User">{audit.maker ?? '—'}</DetailField>
        <DetailField label="Action">
          {audit.actionName ? formatAuditTrailFilterLabel(audit.actionName) : '—'}
        </DetailField>
        <DetailField label="Result">
          {audit.processingResult
            ? formatAuditTrailFilterLabel(audit.processingResult)
            : '—'}
        </DetailField>
        {audit.checker ? <DetailField label="Checker">{audit.checker}</DetailField> : null}
        {audit.checkedOnDate ? (
          <DetailField label="Checked on">
            {formatAuditTrailDateTime(audit.checkedOnDate)}
          </DetailField>
        ) : null}
        {audit.ip ? <DetailField label="Client IP">{audit.ip}</DetailField> : null}
      </DetailFieldGrid>
      {canView ? (
        <Button type="button" variant="outline" size="sm" onClick={() => openAuditTrail(audit)}>
          View full audit details
        </Button>
      ) : null}
    </div>
  );
}

export function LoanTransactionAuditSection({
  audits,
  loadFailed = false
}: {
  audits: FineractAuditTrailListItem[];
  loadFailed?: boolean;
}) {
  if (loadFailed) {
    return (
      <DetailSection title="Audit trail">
        <p className="text-sm text-muted-foreground">
          Audit trail entries could not be loaded for this transaction.
        </p>
      </DetailSection>
    );
  }

  if (audits.length === 0) {
    return (
      <DetailSection title="Audit trail">
        <p className="text-sm text-muted-foreground">
          No audit trail entries were found for this transaction.
        </p>
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Audit trail">
      {audits.length === 1 ? (
        <AuditTrailSummary audit={audits[0]} />
      ) : (
        <AuditTrailEntryList audits={audits} />
      )}
    </DetailSection>
  );
}
