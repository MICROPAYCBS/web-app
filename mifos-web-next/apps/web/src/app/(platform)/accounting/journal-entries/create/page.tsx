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
import { JournalEntryForm } from '@/components/accounting/journal-entries/journal-entry-form';
import { defaultCreateJournalEntryFormValues } from '@/lib/accounting/journal-entry-display';
import { listJournalEntryGlAccounts } from '@/lib/fineract/journal-entries';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { listPaymentTypes } from '@/lib/fineract/payment-types';
import { getServerSession } from '@/lib/session/server';

export default async function CreateJournalEntryPage() {
  const session = await getServerSession();
  if (
    !can(session, resolvePermission('accounting.journal')) ||
    !can(session, 'CREATE_JOURNALENTRY')
  ) {
    notFound();
  }

  const [offices, currencies, paymentTypes, glAccounts] = await Promise.all([
    listOfficeOptions(),
    getOrganizationSelectedCurrencies(),
    listPaymentTypes(),
    listJournalEntryGlAccounts()
  ]);

  const defaultOfficeId = offices[0]?.id;

  return (
    <ListPage
      backLink={<DetailBackLink href="/accounting/journal-entries" label="Back to journal entries" />}
      title="Create journal entry"
      description="Post a manual journal entry with debit and credit lines."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <JournalEntryForm
          initialValues={defaultCreateJournalEntryFormValues(currencies, defaultOfficeId)}
          offices={offices}
          currencies={currencies}
          paymentTypes={paymentTypes}
          glAccounts={glAccounts}
        />
      </div>
    </ListPage>
  );
}
