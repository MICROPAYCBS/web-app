import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatMoney } from '@mifos/domain';
import { isCashPaymentType, type CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';
import {
  activeCashierRequiredMessage,
  cashierInsufficientAmountMessage
} from '@/lib/fineract/cashier-error-messages';
import { cashierAssignmentStatus } from '@/lib/fineract/cashier-display';
import { getCashierPolicySettings } from '@/lib/fineract/cashier-policy';
import { findCurrentUserCashierAssignment } from '@/lib/fineract/current-user-cashier';
import { getOrganizationCashierSummary } from '@/lib/fineract/cashiers';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import {
  getOrganizationPaymentType,
  listOrganizationPaymentTypes
} from '@/lib/fineract/payment-types';

export type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';

export {
  activeCashierRequiredMessage,
  cashierInsufficientAmountMessage
} from '@/lib/fineract/cashier-error-messages';

export async function loadCashierAwarePaymentTypeOptions(
  templateOptions: { id: number; name: string; isSystemDefined?: boolean }[]
): Promise<CashierAwarePaymentTypeOption[]> {
  const organizationPaymentTypes = await listOrganizationPaymentTypes();
  const cashPaymentById = new Map(
    organizationPaymentTypes.map((row) => [row.id, row.isCashPayment === true])
  );

  return templateOptions
    .filter((option) => option.isSystemDefined !== true)
    .map((option) => ({
      id: option.id,
      name: option.name,
      isCashPayment: cashPaymentById.has(option.id)
        ? cashPaymentById.get(option.id) === true
        : isCashPaymentType(option)
    }));
}

export async function hasActiveCashierSession(options: {
  userId: number;
  officeId: number;
}): Promise<boolean> {
  const assignment = await findCurrentUserCashierAssignment(options);
  return assignment != null && cashierAssignmentStatus(assignment.cashier) === 'active';
}

export async function validateCashTransactionCashierSession(options: {
  userId: number;
  officeId: number;
  paymentTypeId: number;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const policy = await getCashierPolicySettings();
  if (!policy.requireCashierForCashTransactions) {
    return { ok: true };
  }

  const paymentType = await getOrganizationPaymentType(options.paymentTypeId);
  if (!isCashPaymentType(paymentType)) {
    return { ok: true };
  }

  const active = await hasActiveCashierSession({
    userId: options.userId,
    officeId: options.officeId
  });
  if (!active) {
    return { ok: false, message: activeCashierRequiredMessage() };
  }

  return { ok: true };
}

export async function validateSettleAmountAgainstNetCash(options: {
  tellerId: string | number;
  cashierId: string | number;
  currencyCode: string;
  txnAmount: number;
}): Promise<{ ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> }> {
  const policy = await getCashierPolicySettings();
  if (!policy.preventCashierOverdraw) {
    return { ok: true };
  }

  const summary = await getOrganizationCashierSummary(
    options.tellerId,
    options.cashierId,
    options.currencyCode
  );
  const netCash = summary.netCash ?? 0;
  if (options.txnAmount <= netCash) {
    return { ok: true };
  }

  const formattedAvailable =
    formatMoney(netCash, options.currencyCode, FINERACT_LOCALE) ?? String(netCash);

  return {
    ok: false,
    message: cashierInsufficientAmountMessage(),
    fieldErrors: {
      txnAmount: `Amount cannot exceed available net cash (${formattedAvailable}).`
    }
  };
}
