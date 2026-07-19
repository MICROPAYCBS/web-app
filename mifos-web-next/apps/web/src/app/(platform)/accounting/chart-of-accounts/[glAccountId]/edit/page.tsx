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
import { GlAccountForm } from '@/components/accounting/chart-of-accounts/gl-account-form';
import { glAccountToFormValues } from '@/lib/accounting/gl-account-display';
import { getStructuredGlCodePolicy } from '@/lib/fineract/gl-account-code-policy';
import { getGlAccount } from '@/lib/fineract/gl-accounts';
import { getServerSession } from '@/lib/session/server';

export default async function EditGlAccountPage({
  params
}: {
  params: Promise<{ glAccountId: string }>;
}) {
  const { glAccountId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.coa')) || !can(session, 'UPDATE_GLACCOUNT')) {
    notFound();
  }

  const id = Number(glAccountId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const account = await getGlAccount(id);
  if (!account) {
    notFound();
  }

  const structuredGlCodePolicy = await getStructuredGlCodePolicy();

  return (
    <ListPage
      backLink={
        <DetailBackLink
          href={`/accounting/chart-of-accounts/${account.id}`}
          label="Back to GL account"
        />
      }
      title={`Edit account: ${account.name}`}
      description="Update account metadata, parent, and posting rules."
    >
      <GlAccountForm
          mode="edit"
          glAccountId={account.id}
          initialValues={glAccountToFormValues(account)}
          template={account}
          structuredGlCodePolicy={structuredGlCodePolicy}
        />
    </ListPage>
  );
}
