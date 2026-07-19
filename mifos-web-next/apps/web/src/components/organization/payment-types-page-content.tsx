'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationPaymentType } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { Suspense } from 'react';
import { PaymentTypeCreateUrlPanel } from '@/components/organization/payment-type-create-url-panel';
import { PaymentTypeEditUrlPanel } from '@/components/organization/payment-type-edit-url-panel';
import { PaymentTypesTable } from '@/components/organization/payment-types-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { paymentTypeCreatePath } from '@/lib/fineract/payment-type-paths';
import { cn } from '@/lib/utils';

export function PaymentTypesPageContent({
  paymentTypes,
  canEdit,
  canDelete,
  canCreate
}: {
  paymentTypes: OrganizationPaymentType[];
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}) {
  return (
    <>
      <ListPage
        title="Payment types"
        description="Manage how payments are categorized across the platform."
        actions={
          <Can permission="CREATE_PAYMENTTYPE">
            <Link href={paymentTypeCreatePath()} className={cn(buttonVariants())}>
              Create payment type
            </Link>
          </Can>
        }
      >
        <PaymentTypesTable
          paymentTypes={paymentTypes}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </ListPage>

      {canCreate ? (
        <Suspense fallback={null}>
          <PaymentTypeCreateUrlPanel />
        </Suspense>
      ) : null}
      {canEdit ? (
        <Suspense fallback={null}>
          <PaymentTypeEditUrlPanel paymentTypes={paymentTypes} />
        </Suspense>
      ) : null}
    </>
  );
}
