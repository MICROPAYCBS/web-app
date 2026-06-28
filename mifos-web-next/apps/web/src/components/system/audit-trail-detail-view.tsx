'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail } from '@mifos/api-client';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { AuditTrailCommandFields } from '@/components/system/audit-trail-command-fields';
import {
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';

export function AuditTrailDetailView({ audit }: { audit: FineractAuditTrailDetail }) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/system/audit-trails" label="Back to audit trails" />}
          title={`Audit trail ${audit.id}`}
          meta={audit.actionName ? `${audit.actionName} on ${audit.entityName ?? 'resource'}` : undefined}
        />
      }
      summary={
        <DetailFieldGrid columns={2}>
          <DetailField label="Status">
            {audit.processingResult
              ? formatAuditTrailFilterLabel(audit.processingResult)
              : '—'}
          </DetailField>
          <DetailField label="User">{audit.maker ?? '—'}</DetailField>
          <DetailField label="Action">
            {audit.actionName ? formatAuditTrailFilterLabel(audit.actionName) : '—'}
          </DetailField>
          <DetailField label="Entity">
            {audit.entityName ? formatAuditTrailFilterLabel(audit.entityName) : '—'}
          </DetailField>
          <DetailField label="Resource ID">{audit.resourceId ?? '—'}</DetailField>
          <DetailField label="Made date">{formatAuditTrailDateTime(audit.madeOnDate)}</DetailField>
          {audit.officeName ? <DetailField label="Office">{audit.officeName}</DetailField> : null}
          {audit.checker ? <DetailField label="Checker">{audit.checker}</DetailField> : null}
          {audit.checkedOnDate ? (
            <DetailField label="Checked date">
              {formatAuditTrailDateTime(audit.checkedOnDate)}
            </DetailField>
          ) : null}
          {audit.savingsAccountNo ? (
            <DetailField label="Savings account">{audit.savingsAccountNo}</DetailField>
          ) : null}
          {audit.groupLevelName ? (
            <DetailField label="Group level">{audit.groupLevelName}</DetailField>
          ) : null}
          {audit.ip ? <DetailField label="Client IP">{audit.ip}</DetailField> : null}
        </DetailFieldGrid>
      }
    >
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium">Changed fields</h3>
        <AuditTrailCommandFields commandAsJson={audit.commandAsJson} />
      </div>
    </DetailPage>
  );
}
