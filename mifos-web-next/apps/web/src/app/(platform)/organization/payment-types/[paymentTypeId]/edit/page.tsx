/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { PaymentTypeEditForm } from '@/components/organization/payment-type-form';
import { getOrganizationPaymentType } from '@/lib/fineract/payment-types';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationPaymentTypeEditPage({
  params
}: {
  params: Promise<{ paymentTypeId: string }>;
}) {
  const { paymentTypeId } = await params;
  const session = await getServerSession();

  if (!can(session, 'UPDATE_PAYMENTTYPE')) {
    notFound();
  }

  let paymentType;
  try {
    paymentType = await getOrganizationPaymentType(paymentTypeId);
  } catch {
    notFound();
  }

  return <PaymentTypeEditForm paymentType={paymentType} />;
}
