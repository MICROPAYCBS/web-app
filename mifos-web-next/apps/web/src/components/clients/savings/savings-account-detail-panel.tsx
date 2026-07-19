'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem, FineractSavingsAccountDetail } from '@mifos/api-client';
import { useMemo } from 'react';
import { SavingsAccountSectionPanel } from '@/components/clients/savings/savings-account-section-panels';
import { useDetailSection } from '@/hooks/use-detail-section';
import {
  SAVINGS_ACCOUNT_DEFAULT_SECTION,
  SAVINGS_ACCOUNT_SECTIONS,
  type SavingsAccountSectionId
} from '@/lib/fineract/savings-account-display';
import type { SavingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-actions';

export function SavingsAccountDetailPanel({
  account,
  clientId,
  reportOrgName,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords,
  transactionActionPermissions = {
    undoTransaction: false,
    undoTransfer: false,
    modifyTransaction: false,
    viewJournal: false
  }
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  reportOrgName: string;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
  transactionActionPermissions?: SavingsTransactionActionPermissions;
}) {
  const sectionIds = useMemo(() => {
    const ids = SAVINGS_ACCOUNT_SECTIONS.map((section) => section.id);
    return ids.filter((id) => id !== 'audit' || canViewAudits);
  }, [canViewAudits]);

  const { activeSection } = useDetailSection(sectionIds, SAVINGS_ACCOUNT_DEFAULT_SECTION);

  return (
    <SavingsAccountSectionPanel
      section={activeSection as SavingsAccountSectionId}
      account={account}
      clientId={clientId}
      reportOrgName={reportOrgName}
      canViewAudits={canViewAudits}
      auditEntries={auditEntries}
      auditLoadFailed={auditLoadFailed}
      auditTotalRecords={auditTotalRecords}
      transactionActionPermissions={transactionActionPermissions}
    />
  );
}
