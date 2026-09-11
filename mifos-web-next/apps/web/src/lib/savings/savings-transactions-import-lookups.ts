import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { listOrganizationPaymentTypes } from '@/lib/fineract/payment-types';
import type { SavingsTransactionImportPaymentType } from '@/lib/savings/savings-transactions-import';

export async function loadSavingsTransactionsImportPaymentTypes(): Promise<
  SavingsTransactionImportPaymentType[]
> {
  const paymentTypes = await listOrganizationPaymentTypes();
  return paymentTypes
    .filter((row) => row.isSystemDefined !== true)
    .map((row) => ({
      id: row.id,
      name: row.name,
      isCashPayment: row.isCashPayment === true
    }));
}
