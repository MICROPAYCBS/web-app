/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { notFound, redirect } from 'next/navigation';
import { LoanProductWizard } from '@/components/products/loan/wizard/loan-product-wizard';
import {
  enrichLoanProductTemplate,
  loanProductDraftFromTemplate
} from '@/lib/fineract/loan-product-draft';
import { parseLoanProductKind } from '@/lib/fineract/loan-product-paths';
import { getLoanProductForEdit } from '@/lib/fineract/loan-products';
import { getServerSession } from '@/lib/session/server';

export default async function EditLoanProductPage({
  params,
  searchParams
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ productType?: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  try {
    assertCan(session, resolvePermission('products.loan.update'));
  } catch {
    redirect('/forbidden');
  }

  const { productId } = await params;
  const { productType } = await searchParams;
  const kind = parseLoanProductKind(productType);

  let rawTemplate;
  try {
    rawTemplate = await getLoanProductForEdit(productId, kind);
  } catch {
    notFound();
  }

  const template = await enrichLoanProductTemplate(rawTemplate);
  const initialDraft = loanProductDraftFromTemplate(template);

  return (
    <LoanProductWizard
      mode="edit"
      productKind={kind}
      template={template}
      initialDraft={initialDraft}
      productId={productId}
    />
  );
}
