/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FrequentPostingsForm } from '@/components/accounting/frequent-postings/frequent-postings-form';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { defaultFrequentPostingFormValues } from '@/lib/accounting/frequent-posting-display';
import { listAccountingRulesForFrequentPostings } from '@/lib/fineract/accounting-rules';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { listPaymentTypes } from '@/lib/fineract/payment-types';
import { getServerSession } from '@/lib/session/server';

export default async function FrequentPostingsPage() {
  const session = await getServerSession();
  if (
    !can(session, resolvePermission('accounting.frequentPostings')) ||
    !can(session, 'CREATE_JOURNALENTRY')
  ) {
    notFound();
  }

  const [offices, accountingRules, currencies, paymentTypes, transactionDate] = await Promise.all([
    listOfficeOptions(),
    listAccountingRulesForFrequentPostings(),
    getOrganizationSelectedCurrencies(),
    listPaymentTypes(),
    getDefaultTransactionDate()
  ]);

  return (
    <ListPage
      backLink={<DetailBackLink href="/accounting/journal-entries" label="Back to journal entries" />}
      title="Frequent postings"
      description="Post journal entries using a predefined accounting rule."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <FrequentPostingsForm
          initialValues={defaultFrequentPostingFormValues(
            currencies,
            offices[0]?.id,
            transactionDate
          )}
          offices={offices}
          currencies={currencies}
          paymentTypes={paymentTypes}
          accountingRules={accountingRules}
        />
      </div>
    </ListPage>
  );
}
