/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { JournalEntryCreateActions } from '@/components/accounting/journal-entries/journal-entry-create-actions';
import { JournalEntryCreateForm } from '@/components/accounting/journal-entries/journal-entry-create-form';
import { defaultCreateJournalEntryFormValues } from '@/lib/accounting/journal-entry-display';
import { resolveCentralBranchClearingGlAccount } from '@/lib/accounting/inter-branch-recon';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { listFinancialActivityMappings } from '@/lib/fineract/financial-activity-mappings';
import { listDepartments } from '@/lib/fineract/departments';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { listJournalEntryGlAccounts } from '@/lib/fineract/journal-entries';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { listPaymentTypes } from '@/lib/fineract/payment-types';
import { getServerSession } from '@/lib/session/server';

const JOURNAL_ENTRIES_LIST_PATH = '/accounting/journal-entries';
const REQUIRE_DEPARTMENT_CONFIG = 'enable-require-department-on-manual-journal-pl-lines';

export default async function CreateJournalEntryPage() {
  const session = await getServerSession();
  if (
    !can(session, resolvePermission('accounting.journal')) ||
    !can(session, 'CREATE_JOURNALENTRY')
  ) {
    notFound();
  }

  const [offices, currencies, paymentTypes, glAccounts, departments, departmentConfig, transactionDate, financialActivityMappings] =
    await Promise.all([
      listOfficeOptions(),
      getOrganizationSelectedCurrencies(),
      listPaymentTypes(),
      listJournalEntryGlAccounts(),
      listDepartments(),
      getGlobalConfigurationByName(REQUIRE_DEPARTMENT_CONFIG),
      getDefaultTransactionDate(),
      listFinancialActivityMappings()
    ]);

  const clearingResolution = resolveCentralBranchClearingGlAccount(
    financialActivityMappings,
    glAccounts
  );

  const defaultOfficeId = offices[0]?.id;
  const initialValues = defaultCreateJournalEntryFormValues(
    currencies,
    defaultOfficeId,
    transactionDate
  );

  const glAccountTypesById = Object.fromEntries(
    glAccounts
      .filter((account) => account.typeId != null)
      .map((account) => [account.id, account.typeId as number])
  );

  return (
    <PlatformRouteLayout>
      <ListPage
        backLink={
          <DetailBackLink href={JOURNAL_ENTRIES_LIST_PATH} label="Back to journal entries" />
        }
        title="Create journal entry"
        description="Post a manual journal entry with debit and credit lines."
        actions={<JournalEntryCreateActions />}
      >
        <JournalEntryCreateForm
          initialValues={initialValues}
          offices={offices}
          currencies={currencies}
          paymentTypes={paymentTypes}
          glAccounts={glAccounts}
          departments={departments}
          validationContext={{
            requireDepartmentOnPlLines: departmentConfig?.enabled ?? false,
            glAccountTypesById
          }}
          clearingConfigured={clearingResolution.clearingGlAccountId != null}
        />
      </ListPage>
    </PlatformRouteLayout>
  );
}
