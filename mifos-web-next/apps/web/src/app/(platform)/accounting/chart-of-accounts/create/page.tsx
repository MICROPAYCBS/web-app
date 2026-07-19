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
import { defaultGlAccountFormValues } from '@/lib/accounting/gl-account-display';
import { getStructuredGlCodePolicy } from '@/lib/fineract/gl-account-code-policy';
import { getGlAccountFormTemplate } from '@/lib/fineract/gl-accounts';
import { getServerSession } from '@/lib/session/server';

export default async function CreateGlAccountPage({
  searchParams
}: {
  searchParams: Promise<{ parent?: string; accountType?: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.coa')) || !can(session, 'CREATE_GLACCOUNT')) {
    notFound();
  }

  const params = await searchParams;
  const parentId = params.parent ? Number(params.parent) : undefined;
  const accountType = params.accountType ? Number(params.accountType) : undefined;
  const template = await getGlAccountFormTemplate();
  const structuredGlCodePolicy = await getStructuredGlCodePolicy();

  return (
    <ListPage
      backLink={<DetailBackLink href="/accounting/chart-of-accounts" label="Back to chart of accounts" />}
      title="Add GL account"
      description="Create a header or detail account in the chart of accounts."
    >
      <GlAccountForm
          mode="create"
          initialValues={defaultGlAccountFormValues(template, {
            parentId: Number.isFinite(parentId) ? parentId : undefined,
            accountType: Number.isFinite(accountType) ? accountType : undefined
          })}
          template={template}
          structuredGlCodePolicy={structuredGlCodePolicy}
        />
    </ListPage>
  );
}
