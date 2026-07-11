/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CentralBranchPaymentWizard } from '@/components/accounting/journal-entries/central-branch-payment/central-branch-payment-wizard';
import {
  generateCentralBranchExpensePaymentReference
} from '@/lib/accounting/central-branch-expense-payment';
import {
  findInterBranchReconMapping,
  resolveCentralBranchClearingGlAccount
} from '@/lib/accounting/inter-branch-recon';
import { formatJournalEntryGlAccountLabel } from '@/lib/accounting/journal-entry-display';
import { formatGlAccountLabel } from '@/lib/accounting/gl-account-display';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { listDepartments } from '@/lib/fineract/departments';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { listFinancialActivityMappings } from '@/lib/fineract/financial-activity-mappings';
import { listJournalEntryGlAccounts } from '@/lib/fineract/journal-entries';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { listPaymentTypes } from '@/lib/fineract/payment-types';
import { getServerSession } from '@/lib/session/server';

const REQUIRE_DEPARTMENT_CONFIG = 'enable-require-department-on-manual-journal-pl-lines';

export default async function CentralBranchPaymentPage() {
  const session = await getServerSession();
  if (
    !can(session, resolvePermission('accounting.journal')) ||
    !can(session, 'CREATE_JOURNALENTRY')
  ) {
    notFound();
  }

  const [
    offices,
    currencies,
    paymentTypes,
    glAccounts,
    departments,
    departmentConfig,
    transactionDate,
    financialActivityMappings
  ] = await Promise.all([
    listOfficeOptions(),
    getOrganizationSelectedCurrencies(),
    listPaymentTypes(),
    listJournalEntryGlAccounts(),
    listDepartments(),
    getGlobalConfigurationByName(REQUIRE_DEPARTMENT_CONFIG),
    getDefaultTransactionDate(),
    listFinancialActivityMappings()
  ]);

  const defaultOfficeId = offices[0]?.id ?? 0;
  const defaultCurrency = currencies[0]?.code ?? '';
  const clearing = resolveCentralBranchClearingGlAccount(financialActivityMappings, glAccounts);
  const clearingGlAccountId = clearing.clearingGlAccountId ?? 0;
  const mappedAccount = findInterBranchReconMapping(financialActivityMappings)?.glAccountData;
  const clearingAccount = glAccounts.find((account) => account.id === clearingGlAccountId);
  const clearingGlAccountLabel = clearingAccount
    ? formatJournalEntryGlAccountLabel(clearingAccount)
    : mappedAccount
      ? formatGlAccountLabel(mappedAccount)
      : 'Inter-branch reconciliation';

  return (
    <CentralBranchPaymentWizard
      initialValues={{
        fundingOfficeId: defaultOfficeId,
        bankGlAccountId: 0,
        currencyCode: defaultCurrency,
        transactionDate,
        referenceNumber: generateCentralBranchExpensePaymentReference(),
        comments: '',
        expenseLines: [{ branchOfficeId: 0, expenseGlAccountId: 0, amount: 0 }]
      }}
      offices={offices}
      currencies={currencies}
      paymentTypes={paymentTypes}
      glAccounts={glAccounts}
      departments={departments}
      validationContext={{
        requireDepartmentOnExpenseLines: departmentConfig?.enabled ?? false
      }}
      clearingGlAccountId={clearingGlAccountId}
      clearingGlAccountLabel={clearingGlAccountLabel}
      clearingWarning={clearing.warning}
    />
  );
}
