'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import { ScrollText } from 'lucide-react';
import { AuditTrailEntryList } from '@/components/audit/audit-trail-entry-list';
import { EmptyState } from '@/components/composites';

export function SavingsAccountAuditView({
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
        description="Audit entries could not be loaded for this savings account."
      />
    );
  }

  if (audits.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No audit entries"
        description="No audit trail entries were found for this savings account."
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
        audit {audits.length === 1 ? 'entry' : 'entries'}, newest first.
        Select an entry to review all fields involved in the change.
      </p>
      <AuditTrailEntryList audits={audits} />
    </div>
  );
}
