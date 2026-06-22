import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createFineractClient } from '@/lib/fineract/create-client';
import { asCurrency } from '@/lib/fineract/product-normalize';
import { resolvePaymentTypeId } from '@/lib/fineract/savings-payment-type-options';
import {
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_ID,
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAME,
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES,
  SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME,
  type SavingsAccountBlockReasonKind,
  type SavingsAccountChargeCommand,
  type SavingsAccountExistingTransactionCommand,
  type SavingsAccountLifecycleCommand,
  type SavingsAccountTransactionCommand
} from '@/lib/fineract/savings-account-command-meta';

export {
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_ID,
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAME,
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_NAMES,
  SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME,
  type SavingsAccountBlockReasonKind,
  type SavingsAccountChargeCommand,
  type SavingsAccountExistingTransactionCommand,
  type SavingsAccountLifecycleCommand,
  type SavingsAccountTransactionCommand
};

const SAVINGS_ACCOUNTS_PATH = '/savingsaccounts';

export interface SavingsAccountPaymentTypeOption {
  id: number;
  name: string;
  isSystemDefined?: boolean;
}

export interface SavingsAccountTransactionTemplate {
  paymentTypeOptions?: SavingsAccountPaymentTypeOption[];
}

export interface SavingsAccountChargeOption {
  id: number;
  name: string;
}

export interface SavingsAccountChargeTemplate {
  chargeOptions: SavingsAccountChargeOption[];
}

export interface SavingsAccountChargeDetailTemplate {
  id: number;
  name?: string;
  amount?: number;
  feeInterval?: number;
  currencyCode?: string;
  chargeTimeType?: { id: number; value?: string; code?: string };
  chargeCalculationType?: { id: number; value?: string; code?: string };
}

export async function executeSavingsAccountCommand(
  accountId: string | number,
  command: SavingsAccountLifecycleCommand,
  body: Record<string, unknown>
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${SAVINGS_ACCOUNTS_PATH}/${accountId}`, body, { command });
}

export async function executeSavingsAccountTransaction(
  accountId: string | number,
  command: SavingsAccountTransactionCommand,
  body: Record<string, unknown>
): Promise<{ resourceId?: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId?: number }>(
    `${SAVINGS_ACCOUNTS_PATH}/${accountId}/transactions`,
    body,
    { command }
  );
}

export async function executeSavingsAccountExistingTransaction(
  accountId: string | number,
  transactionId: string | number,
  command: SavingsAccountExistingTransactionCommand,
  body: Record<string, unknown>
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(
    `${SAVINGS_ACCOUNTS_PATH}/${accountId}/transactions/${transactionId}`,
    body,
    { command }
  );
}

export async function executeSavingsAccountChargeCommand(
  accountId: string | number,
  chargeId: string | number,
  command: SavingsAccountChargeCommand,
  body: Record<string, unknown>
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${SAVINGS_ACCOUNTS_PATH}/${accountId}/charges/${chargeId}`, body, {
    command
  });
}

export async function createSavingsAccountCharge(
  accountId: string | number,
  body: Record<string, unknown>
): Promise<{ resourceId?: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId?: number }>(
    `${SAVINGS_ACCOUNTS_PATH}/${accountId}/charges`,
    body
  );
}

export async function deleteSavingsAccount(accountId: string | number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${SAVINGS_ACCOUNTS_PATH}/${accountId}`);
}

export async function updateSavingsAccountWithholdTax(
  accountId: string | number,
  withHoldTax: boolean
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(`${SAVINGS_ACCOUNTS_PATH}/${accountId}`, { withHoldTax }, {
    command: 'updateWithHoldTax'
  });
}

export async function getSavingsAccountTransactionTemplate(
  accountId: string | number,
  command: Extract<SavingsAccountTransactionCommand, 'deposit' | 'withdrawal'>
): Promise<SavingsAccountTransactionTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    `${SAVINGS_ACCOUNTS_PATH}/${accountId}/transactions/template`,
    { command }
  );
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return { paymentTypeOptions: normalizePaymentTypeOptions(raw) };
}

export interface SavingsAccountTransactionModifyTemplate extends SavingsAccountTransactionTemplate {
  amount?: number;
  date?: number[] | string;
  paymentTypeId?: number;
  note?: string;
  paymentDetailData?: {
    paymentType?: { id?: number; name?: string };
    accountNumber?: string;
    checkNumber?: string;
    routingCode?: string;
    receiptNumber?: string;
    bankNumber?: string;
  };
}

export async function getSavingsAccountTransactionModifyTemplate(
  accountId: string | number,
  transactionId: string | number
): Promise<SavingsAccountTransactionModifyTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    `${SAVINGS_ACCOUNTS_PATH}/${accountId}/transactions/${transactionId}`,
    { template: 'true' }
  );
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const payment = row.paymentDetailData;
  let paymentDetailData: SavingsAccountTransactionModifyTemplate['paymentDetailData'];
  let paymentTypeFromDetail: { id?: number; name?: string } | undefined;
  if (payment && typeof payment === 'object') {
    const detail = payment as Record<string, unknown>;
    const paymentTypeRaw = detail.paymentType;
    if (paymentTypeRaw && typeof paymentTypeRaw === 'object') {
      const paymentType = paymentTypeRaw as Record<string, unknown>;
      const paymentTypeId = resolvePaymentTypeId(
        typeof paymentType.id === 'number' || typeof paymentType.id === 'string'
          ? paymentType.id
          : undefined
      );
      const paymentTypeName =
        typeof paymentType.name === 'string' ? paymentType.name : undefined;
      if (paymentTypeId != null || paymentTypeName) {
        paymentTypeFromDetail = { id: paymentTypeId, name: paymentTypeName };
      }
    }
    paymentDetailData = {
      paymentType: paymentTypeFromDetail,
      accountNumber: typeof detail.accountNumber === 'string' ? detail.accountNumber : undefined,
      checkNumber: typeof detail.checkNumber === 'string' ? detail.checkNumber : undefined,
      routingCode: typeof detail.routingCode === 'string' ? detail.routingCode : undefined,
      receiptNumber: typeof detail.receiptNumber === 'string' ? detail.receiptNumber : undefined,
      bankNumber: typeof detail.bankNumber === 'string' ? detail.bankNumber : undefined
    };
  }
  const paymentTypeRaw = row.paymentType;
  let paymentTypeFromRoot: { id?: number; name?: string } | undefined;
  if (paymentTypeRaw && typeof paymentTypeRaw === 'object') {
    const paymentType = paymentTypeRaw as Record<string, unknown>;
    const paymentTypeId = resolvePaymentTypeId(
      typeof paymentType.id === 'number' || typeof paymentType.id === 'string'
        ? paymentType.id
        : undefined
    );
    const paymentTypeName = typeof paymentType.name === 'string' ? paymentType.name : undefined;
    if (paymentTypeId != null || paymentTypeName) {
      paymentTypeFromRoot = { id: paymentTypeId, name: paymentTypeName };
    }
  }
  const paymentTypeId = resolvePaymentTypeId(
    typeof row.paymentTypeId === 'number' || typeof row.paymentTypeId === 'string'
      ? row.paymentTypeId
      : undefined,
    paymentTypeFromRoot?.id,
    paymentTypeFromDetail?.id
  );
  return {
    paymentTypeOptions: normalizePaymentTypeOptions(raw),
    amount:
      typeof row.amount === 'number'
        ? row.amount
        : Number.isFinite(Number(row.amount))
          ? Number(row.amount)
          : undefined,
    date:
      typeof row.date === 'string' || Array.isArray(row.date)
        ? (row.date as string | number[])
        : undefined,
    paymentTypeId,
    note: typeof row.note === 'string' ? row.note : undefined,
    paymentDetailData
  };
}

function normalizePaymentTypeOptions(raw: unknown): SavingsAccountPaymentTypeOption[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const row = raw as Record<string, unknown>;
  const options = Array.isArray(row.paymentTypeOptions) ? row.paymentTypeOptions : [];
  const paymentTypeOptions: SavingsAccountPaymentTypeOption[] = [];
  for (const item of options) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const option = item as Record<string, unknown>;
    const id = Number(option.id);
    const name = typeof option.name === 'string' ? option.name : '';
    if (!Number.isFinite(id) || !name) {
      continue;
    }
    paymentTypeOptions.push({
      id,
      name,
      isSystemDefined: option.isSystemDefined === true
    });
  }
  return paymentTypeOptions;
}

export async function getSavingsAccountChargeTemplate(
  accountId: string | number
): Promise<SavingsAccountChargeTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${SAVINGS_ACCOUNTS_PATH}/${accountId}/charges/template`);
  if (!raw || typeof raw !== 'object') {
    return { chargeOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const options = Array.isArray(row.chargeOptions) ? row.chargeOptions : [];
  const chargeOptions: SavingsAccountChargeOption[] = [];
  for (const item of options) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const option = item as Record<string, unknown>;
    const id = Number(option.id);
    const name = typeof option.name === 'string' ? option.name : '';
    if (!Number.isFinite(id) || !name) {
      continue;
    }
    chargeOptions.push({ id, name });
  }
  return { chargeOptions };
}

export async function getSavingsAccountChargeDetailTemplate(
  chargeId: string | number
): Promise<SavingsAccountChargeDetailTemplate | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/charges/${chargeId}`, { template: 'true' });
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const enumOption = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }
    const item = value as Record<string, unknown>;
    const optionId = Number(item.id);
    if (!Number.isFinite(optionId)) {
      return undefined;
    }
    return {
      id: optionId,
      value: typeof item.value === 'string' ? item.value : undefined,
      code: typeof item.code === 'string' ? item.code : undefined
    };
  };
  const currency = asCurrency(row.currency);
  return {
    id,
    name: typeof row.name === 'string' ? row.name : undefined,
    amount:
      typeof row.amount === 'number'
        ? row.amount
        : Number.isFinite(Number(row.amount))
          ? Number(row.amount)
          : undefined,
    feeInterval:
      typeof row.feeInterval === 'number'
        ? row.feeInterval
        : Number.isFinite(Number(row.feeInterval))
          ? Number(row.feeInterval)
          : undefined,
    currencyCode:
      currency?.code ?? (typeof row.currencyCode === 'string' ? row.currencyCode : undefined),
    chargeTimeType: enumOption(row.chargeTimeType),
    chargeCalculationType: enumOption(row.chargeCalculationType)
  };
}
