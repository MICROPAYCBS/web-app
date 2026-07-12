/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { assertCan, resolvePermission } from '@mifos/auth';

import { FineractHttpError } from '@mifos/api-client';

import Link from 'next/link';

import { redirect } from 'next/navigation';

import { CreateLoanAccountWizard } from '@/components/clients/loan-account/wizard/create-loan-account-wizard';

import { buttonVariants } from '@/components/ui/button';

import { clientAccountListPath } from '@/lib/fineract/client-account-links';

import { getClient } from '@/lib/fineract/clients';

import { getClientLoanAccountTemplate } from '@/lib/fineract/client-loan-accounts';
import { emptyLoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';

import { platformInset, platformScrollRegion } from '@/lib/platform-layout';

import { getServerSession } from '@/lib/session/server';

import { cn } from '@/lib/utils';



export default async function NewLoanAccountPage({

  params

}: {

  params: Promise<{ clientId: string }>;

}) {

  const session = await getServerSession();

  if (!session) {

    redirect('/login');

  }



  try {

    assertCan(session, resolvePermission('loans.create'));

  } catch {

    redirect('/forbidden');

  }



  const { clientId } = await params;

  const client = await getClient(clientId);

  const clientDisplayName = client.displayName ?? undefined;



  let template;

  try {

    template = await getClientLoanAccountTemplate(clientId);

  } catch (err) {

    const message =

      err instanceof FineractHttpError

        ? err.message

        : 'Could not load the loan application form.';



    return (
      <div className={platformScrollRegion}>
        <div className={cn('space-y-4', platformInset)}>

        <p

          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"

          role="alert"

        >

          {message}

        </p>

        <Link

          href={clientAccountListPath(clientId, 'loan')}

          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}

        >

          Back to loans

        </Link>
        </div>
      </div>
    );

  }



  const defaultTransactionDate = await getDefaultTransactionDate().catch(() => undefined);

  return (

    <CreateLoanAccountWizard

      clientId={clientId}

      clientDisplayName={clientDisplayName}

      initialTemplate={template}

      initialDraft={emptyLoanAccountDraft(defaultTransactionDate)}

    />

  );

}

