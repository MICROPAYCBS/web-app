'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { tellerCashierDetailPath } from '@/lib/fineract/teller-paths';

export function CashierSessionRequiredAlert({
  tellerId,
  cashierId,
  canOpenCashierDetail
}: {
  tellerId?: number;
  cashierId?: number;
  canOpenCashierDetail?: boolean;
}) {
  const detailHref =
    tellerId != null && cashierId != null && canOpenCashierDetail
      ? tellerCashierDetailPath(tellerId, cashierId)
      : null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <p className="font-medium">Active cashier session required</p>
      <p className="mt-1 text-destructive/90">
        Cash payment types require an active cashier assignment before you can post this
        transaction.
      </p>
      {detailHref ? (
        <p className="mt-2">
          <Link href={detailHref} className="underline underline-offset-4">
            Open your cashier session
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-destructive/90">
          Ask your branch manager to assign you as an active cashier for today.
        </p>
      )}
    </div>
  );
}
