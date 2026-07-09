/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { can, resolvePermission } from '@mifos/auth';

import { notFound } from 'next/navigation';

import { JournalEntryWizard } from '@/components/accounting/journal-entries/wizard/journal-entry-wizard';

import {

  createJournalEntryFormValuesForRule,

  defaultCreateJournalEntryFormValues

} from '@/lib/accounting/journal-entry-display';

import { listAccountingRulesForFrequentPostings } from '@/lib/fineract/accounting-rules';

import { getDefaultTransactionDate } from '@/lib/fineract/business-date';

import { listDepartments } from '@/lib/fineract/departments';

import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';

import { listJournalEntryGlAccounts } from '@/lib/fineract/journal-entries';

import { listOfficeOptions } from '@/lib/fineract/offices';

import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';

import { listPaymentTypes } from '@/lib/fineract/payment-types';

import { getServerSession } from '@/lib/session/server';



const REQUIRE_DEPARTMENT_CONFIG = 'enable-require-department-on-manual-journal-pl-lines';



export default async function CreateJournalEntryPage({

  searchParams

}: {

  searchParams: Promise<Record<string, string | string[] | undefined>>;

}) {

  const session = await getServerSession();

  if (

    !can(session, resolvePermission('accounting.journal')) ||

    !can(session, 'CREATE_JOURNALENTRY')

  ) {

    notFound();

  }



  const params = await searchParams;

  const ruleParam = params.rule;

  const ruleId =

    typeof ruleParam === 'string' && ruleParam.trim()

      ? Number(ruleParam.trim())

      : Number.NaN;



  const [

    offices,

    currencies,

    paymentTypes,

    glAccounts,

    departments,

    accountingRules,

    departmentConfig,

    transactionDate

  ] = await Promise.all([

    listOfficeOptions(),

    getOrganizationSelectedCurrencies(),

    listPaymentTypes(),

    listJournalEntryGlAccounts(),

    listDepartments(),

    listAccountingRulesForFrequentPostings(),

    getGlobalConfigurationByName(REQUIRE_DEPARTMENT_CONFIG),

    getDefaultTransactionDate()

  ]);



  const defaultOfficeId = offices[0]?.id;

  const selectedRule =

    Number.isFinite(ruleId) && ruleId > 0

      ? accountingRules.find((rule) => rule.id === ruleId)

      : undefined;



  const initialValues = selectedRule

    ? createJournalEntryFormValuesForRule(

        selectedRule,

        currencies,

        defaultOfficeId,

        transactionDate

      )

    : defaultCreateJournalEntryFormValues(currencies, defaultOfficeId, transactionDate);



  const glAccountTypesById = Object.fromEntries(

    glAccounts

      .filter((account) => account.typeId != null)

      .map((account) => [account.id, account.typeId as number])

  );



  return (

    <JournalEntryWizard

      initialValues={initialValues}

      offices={offices}

      currencies={currencies}

      paymentTypes={paymentTypes}

      glAccounts={glAccounts}

      departments={departments}

      accountingRules={accountingRules}

      validationContext={{

        requireDepartmentOnPlLines: departmentConfig?.enabled ?? false,

        glAccountTypesById

      }}

    />

  );

}

