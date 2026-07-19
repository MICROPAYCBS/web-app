'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail } from '@mifos/api-client';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { AuditTrailCommandFields } from '@/components/system/audit-trail-command-fields';
import {
  formatAuditTrailDateTime,
  formatAuditTrailFilterLabel
} from '@/lib/fineract/audit-trail-display';

export function AuditTrailDetailContent({
  audit,
  previousCommandAsJson,
  variant = 'full'
}: {
  audit: FineractAuditTrailDetail;
  previousCommandAsJson?: string;
  variant?: 'full' | 'fields-only';
}) {
  const actionLabel = audit.actionName
    ? formatAuditTrailFilterLabel(audit.actionName)
    : '—';
  const entityLabel = audit.entityName ? formatAuditTrailFilterLabel(audit.entityName) : '—';

  return (
    <div className="space-y-6">
      {variant === 'full' ? (
        <DetailFieldGrid columns={2}>
          <DetailField label="Audit ID">{audit.id}</DetailField>
          <DetailField label="Made on">{formatAuditTrailDateTime(audit.madeOnDate)}</DetailField>
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
          {audit.officeName ? <DetailField label="Office">{audit.officeName}</DetailField> : null}
          {audit.checker ? <DetailField label="Checker">{audit.checker}</DetailField> : null}
          {audit.checkedOnDate ? (
            <DetailField label="Checked on">
              {formatAuditTrailDateTime(audit.checkedOnDate)}
            </DetailField>
          ) : null}
          {audit.savingsAccountNo ? (
            <DetailField label="Savings account">{audit.savingsAccountNo}</DetailField>
          ) : null}
          {audit.groupLevelName ? (
            <DetailField label="Group level">{audit.groupLevelName}</DetailField>
          ) : null}
          {audit.groupName ? <DetailField label="Group">{audit.groupName}</DetailField> : null}
          {audit.clientName ? <DetailField label="Customer">{audit.clientName}</DetailField> : null}
          {audit.ip ? <DetailField label="Client IP">{audit.ip}</DetailField> : null}
        </DetailFieldGrid>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Changed fields</h3>
        <AuditTrailCommandFields
          commandAsJson={audit.commandAsJson}
          previousCommandAsJson={previousCommandAsJson}
          entityName={audit.entityName}
        />
      </div>
    </div>
  );
}
