'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAuditTrailListItem,
  FineractShareAccountDetail
} from '@mifos/api-client';
import { useMemo } from 'react';
import { ShareAccountSectionPanel } from '@/components/clients/shares/share-account-section-panels';
import { useDetailSection } from '@/hooks/use-detail-section';
import {
  SHARE_ACCOUNT_DEFAULT_SECTION,
  SHARE_ACCOUNT_SECTIONS,
  type ShareAccountSectionId
} from '@/lib/fineract/share-account-display';

export function ShareAccountDetailPanel({
  account,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords
}: {
  account: FineractShareAccountDetail;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
}) {
  const sectionIds = useMemo(() => {
    const ids = SHARE_ACCOUNT_SECTIONS.map((section) => section.id);
    return ids.filter((id) => id !== 'audit' || canViewAudits);
  }, [canViewAudits]);

  const { activeSection } = useDetailSection(sectionIds, SHARE_ACCOUNT_DEFAULT_SECTION);

  return (
    <ShareAccountSectionPanel
      section={activeSection as ShareAccountSectionId}
      account={account}
      canViewAudits={canViewAudits}
      auditEntries={auditEntries}
      auditLoadFailed={auditLoadFailed}
      auditTotalRecords={auditTotalRecords}
    />
  );
}
