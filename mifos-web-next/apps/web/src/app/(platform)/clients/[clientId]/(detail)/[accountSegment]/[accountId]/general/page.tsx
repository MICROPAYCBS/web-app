/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { notFound } from 'next/navigation';

import { ClientAccountDetailPlaceholder } from '@/components/clients/detail/client-account-detail-placeholder';

import {

  CLIENT_ACCOUNT_RESERVED_IDS

} from '@/lib/fineract/client-action-paths';

import {

  clientAccountListPath,

  isClientAccountSegment,

  productKindFromAccountSegment,

  type ClientAccountProductKind

} from '@/lib/fineract/client-account-links';



const ACCOUNT_TITLES: Record<

  ReturnType<typeof productKindFromAccountSegment>,

  { title: string; backLabel: string }

> = {

  loan: { title: 'Loan account', backLabel: 'loans' },

  savings: { title: 'Savings account', backLabel: 'savings' },

  fixedDeposit: { title: 'Fixed deposit account', backLabel: 'fixed deposits' },

  recurringDeposit: { title: 'Recurring deposit account', backLabel: 'recurring deposits' },

  share: { title: 'Share account', backLabel: 'shares' }

};



export default async function ClientAccountGeneralPage({

  params

}: {

  params: Promise<{ clientId: string; accountSegment: string; accountId: string }>;

}) {

  const { clientId, accountSegment, accountId } = await params;



  if (!isClientAccountSegment(accountSegment) || CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {

    notFound();

  }



  const kind = productKindFromAccountSegment(accountSegment);



  if (kind === 'savings' || kind === 'loan' || kind === 'fixedDeposit' || kind === 'recurringDeposit') {

    notFound();

  }



  const copy = ACCOUNT_TITLES[kind];



  return (

    <ClientAccountDetailPlaceholder

      title={copy.title}

      accountId={accountId}

      backHref={clientAccountListPath(clientId, kind)}

      backLabel={copy.backLabel}

    />

  );

}

