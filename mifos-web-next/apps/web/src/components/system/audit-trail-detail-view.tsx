'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail } from '@mifos/api-client';
import { AuditTrailDetailContent } from '@/components/audit/audit-trail-detail-content';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage
} from '@/components/composites';

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
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <AuditTrailDetailContent audit={audit} />
      </div>
    </DetailPage>
  );
}
