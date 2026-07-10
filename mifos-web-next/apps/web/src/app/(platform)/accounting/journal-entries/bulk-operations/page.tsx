/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { BulkJournalOperationsHub } from '@/components/accounting/journal-entries/bulk-operations/bulk-journal-operations-hub';
import {
  defaultBulkConstructForm,
  isBulkConstructEligibleRule,
  partitionBulkConstructRules
} from '@/lib/accounting/bulk-journal-construct';
import { listAccountingRulesForFrequentPostings } from '@/lib/fineract/accounting-rules';
import { getBulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { JOURNAL_ENTRIES_BULK_IMPORT_NAME } from '@/lib/fineract/bulk-import-paths';
import { listBulkImportHistory } from '@/lib/fineract/bulk-import';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { listDepartments } from '@/lib/fineract/departments';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { listJournalEntryGlAccounts } from '@/lib/fineract/journal-entries';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { getServerSession } from '@/lib/session/server';

const REQUIRE_DEPARTMENT_CONFIG = 'enable-require-department-on-manual-journal-pl-lines';

export default async function BulkJournalOperationsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.journal'))) {
    notFound();
  }

  const importDefinition = getBulkImportDefinition(JOURNAL_ENTRIES_BULK_IMPORT_NAME);
  if (!importDefinition) {
    notFound();
  }

  const canConstruct = can(session, 'CREATE_JOURNALENTRY');
  const canDownloadImport = can(session, importDefinition.downloadPermission);

  const [
    offices,
    currencies,
    glAccounts,
    departments,
    accountingRules,
    departmentConfig,
    transactionDate,
    importOffices,
    importHistory
  ] = await Promise.all([
    listOfficeOptions(),
    getOrganizationSelectedCurrencies(),
    listJournalEntryGlAccounts(),
    listDepartments(),
    listAccountingRulesForFrequentPostings(),
    getGlobalConfigurationByName(REQUIRE_DEPARTMENT_CONFIG),
    getDefaultTransactionDate().catch(() => undefined),
    importDefinition.formFields >= 1 ? listOfficeOptions() : Promise.resolve([]),
    listBulkImportHistory(importDefinition.entityType).catch(() => [])
  ]);

  const { eligible } = partitionBulkConstructRules(accountingRules);
  const defaultOfficeId = offices[0]?.id;
  const defaultRuleId = eligible[0]?.id;

  const glAccountTypesById = Object.fromEntries(
    glAccounts
      .filter((account) => account.typeId != null)
      .map((account) => [account.id, account.typeId as number])
  );

  const initialValues = defaultBulkConstructForm(
    currencies,
    defaultOfficeId,
    transactionDate,
    defaultRuleId
  );

  if (defaultRuleId && eligible[0] && !isBulkConstructEligibleRule(eligible[0])) {
    initialValues.template.accountingRuleId = 0;
  }

  return (
    <BulkJournalOperationsHub
      canConstruct={canConstruct}
      constructProps={{
        initialValues,
        offices,
        currencies,
        departments,
        accountingRules,
        glAccounts,
        validationContext: {
          requireDepartmentOnPlLines: departmentConfig?.enabled ?? false,
          glAccountTypesById
        }
      }}
      importDefinition={importDefinition}
      importOffices={importOffices}
      importHistory={importHistory}
      canDownloadImport={canDownloadImport}
    />
  );
}
