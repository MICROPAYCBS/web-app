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
import { notFound, redirect } from 'next/navigation';
import { LoanAccountWizard } from '@/components/clients/loan-account/wizard/create-loan-account-wizard';
import { buttonVariants } from '@/components/ui/button';
import {
  CLIENT_ACCOUNT_RESERVED_IDS
} from '@/lib/fineract/client-action-paths';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { loanAccountDraftFromEditTemplate, loanAccountIsModifiableStatus } from '@/lib/fineract/client-loan-account-edit-draft';
import { getClientLoanAccountEditContext } from '@/lib/fineract/client-loan-accounts';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import { getClient } from '@/lib/fineract/clients';
import { platformInset, platformScrollRegion } from '@/lib/platform-layout';
import { getServerSession } from '@/lib/session/server';
import { cn } from '@/lib/utils';

export default async function EditLoanAccountPage({
  params
}: {
  params: Promise<{ clientId: string; accountId: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('loans.update'));
  } catch {
    redirect('/forbidden');
  }

  const { clientId, accountId } = await params;

  if (CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {
    notFound();
  }

  const account = await getLoanAccount(accountId);
  if (!account) {
    notFound();
  }

  if (account.clientId != null && String(account.clientId) !== clientId) {
    notFound();
  }

  if (!loanAccountIsModifiableStatus(account.status)) {
    redirect(clientAccountGeneralPath(clientId, 'loan', accountId));
  }

  const client = await getClient(clientId);
  const clientDisplayName = client.displayName ?? undefined;

  let editContext;
  try {
    editContext = await getClientLoanAccountEditContext(accountId);
  } catch (err) {
    const message =
      err instanceof FineractHttpError
        ? err.message
        : 'Could not load the loan application for editing.';

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
            href={clientAccountGeneralPath(clientId, 'loan', accountId)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Back to loan account
          </Link>
        </div>
      </div>
    );
  }

  const initialDraft = loanAccountDraftFromEditTemplate(
    editContext.raw,
    editContext.template
  );

  return (
    <LoanAccountWizard
      mode="edit"
      loanId={accountId}
      clientId={clientId}
      clientDisplayName={clientDisplayName}
      initialTemplate={editContext.template}
      initialDraft={initialDraft}
    />
  );
}
