'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { LoanAccountSectionPanel } from '@/components/clients/loan-account/loan-account-section-panels';
import {
  LOAN_ACCOUNT_CASHIER_SECTION_ID,
  useLoanAccountDetailSection
} from '@/components/clients/loan-account/loan-account-detail-sidebar';
import type { LoanAccountStandingInstructionContext } from '@/components/clients/loan-account/loan-account-standing-instruction-context';
import type { LoanAccountSectionId } from '@/lib/fineract/loan-account-display';
import { AccountCashierPanel } from '@/components/accounts/account-cashier-panel';
import type { AccountCashierSnapshot } from '@/lib/fineract/cashier-display';

export function LoanAccountDetailPanel({
  account,
  clientId,
  cashierSnapshot = null,
  reportOrgName,
  standingInstructions = null,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  cashierSnapshot?: AccountCashierSnapshot | null;
  reportOrgName: string;
  standingInstructions?: LoanAccountStandingInstructionContext | null;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
}) {
  const includeCashier = Boolean(cashierSnapshot);
  const standingInstructionsEnabled = standingInstructions != null;
  const { activeSection } = useLoanAccountDetailSection(account, {
    includeCashier,
    standingInstructions: standingInstructionsEnabled,
    canViewAudits
  });

  if (activeSection === LOAN_ACCOUNT_CASHIER_SECTION_ID && cashierSnapshot) {
    return <AccountCashierPanel snapshot={cashierSnapshot} />;
  }

  return (
    <LoanAccountSectionPanel
      section={activeSection as LoanAccountSectionId}
      account={account}
      clientId={clientId}
      reportOrgName={reportOrgName}
      standingInstructions={standingInstructions}
      canViewAudits={canViewAudits}
      auditEntries={auditEntries}
      auditLoadFailed={auditLoadFailed}
      auditTotalRecords={auditTotalRecords}
    />
  );
}
