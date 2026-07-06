import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import { fineractApiDateToFormString, formatFineractDateValue } from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';
import type { LoanAccountChargeTemplateOption } from '@/lib/fineract/loan-account-types';
import type {
  LoanAccountLifecycleCommand,
  LoanAccountTransactionCommand
} from '@/lib/fineract/loan-account-command-meta';

export interface LoanAccountPaymentTypeOption {
  id: number;
  name: string;
}

export interface LoanAccountWriteOffReasonOption {
  id: number;
  name: string;
}

export interface LoanAccountApprovalTemplate {
  approvalAmount?: number;
  expectedDisbursementDate?: string;
}

export interface LoanAccountTransactionTemplate {
  amount?: number;
  date?: string;
  paymentTypeOptions?: LoanAccountPaymentTypeOption[];
  writeOffReasonOptions?: LoanAccountWriteOffReasonOption[];
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizePaymentTypeOptions(raw: unknown): LoanAccountPaymentTypeOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const name =
        typeof row.name === 'string'
          ? row.name
          : typeof row.value === 'string'
            ? row.value
            : undefined;
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is LoanAccountPaymentTypeOption => item != null);
}

function normalizeWriteOffReasonOptions(raw: unknown): LoanAccountWriteOffReasonOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const name =
        typeof row.name === 'string'
          ? row.name
          : typeof row.value === 'string'
            ? row.value
            : undefined;
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is LoanAccountWriteOffReasonOption => item != null);
}

function normalizeTransactionTemplate(raw: unknown): LoanAccountTransactionTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  return {
    amount: toNumber(row.amount),
    date: formatFineractDateValue(row.date),
    paymentTypeOptions: normalizePaymentTypeOptions(row.paymentTypeOptions),
    writeOffReasonOptions: normalizeWriteOffReasonOptions(row.writeOffReasonOptions)
  };
}

export async function getLoanAccountApprovalTemplate(
  accountId: string | number
): Promise<LoanAccountApprovalTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}/template`, {
    templateType: 'approval',
    associations: 'delinquency'
  });
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const timelineExpected =
    row.timeline && typeof row.timeline === 'object'
      ? (row.timeline as Record<string, unknown>).expectedDisbursementDate
      : undefined;
  return {
    approvalAmount: toNumber(row.approvalAmount ?? row.proposedPrincipal),
    expectedDisbursementDate: fineractApiDateToFormString(
      (row.expectedDisbursementDate ?? timelineExpected) as number[] | string | undefined
    )
  };
}

export async function getLoanAccountTransactionTemplate(
  accountId: string | number,
  command: LoanAccountTransactionCommand | 'disburse' | 'disburseToSavings'
): Promise<LoanAccountTransactionTemplate> {
  const fineract = await createFineractClient();
  const params: Record<string, string> = { command };
  if (command === 'disburse' || command === 'disburseToSavings') {
    params.associations = 'delinquency';
  }
  const raw = await fineract.get<unknown>(`/loans/${accountId}/transactions/template`, params);
  return normalizeTransactionTemplate(raw);
}

export async function executeLoanAccountLifecycleCommand(
  accountId: string | number,
  command: LoanAccountLifecycleCommand,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`/loans/${accountId}`, body, { command });
}

export async function executeLoanAccountTransactionCommand(
  accountId: string | number,
  command: LoanAccountTransactionCommand,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `/loans/${accountId}/transactions`,
    body,
    { command }
  );
}

export async function deleteLoanAccount(accountId: string | number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/loans/${accountId}`);
}

export type { LoanAccountChargeTemplateOption } from '@/lib/fineract/loan-account-types';

function normalizeChargeTemplateOption(raw: unknown): LoanAccountChargeTemplateOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id ?? row.chargeId);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
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
  const currency =
    row.currency && typeof row.currency === 'object'
      ? (row.currency as Record<string, unknown>)
      : undefined;
  return {
    id,
    name,
    amount: toNumber(row.amount),
    amountOrPercentage: toNumber(row.amountOrPercentage),
    percentage: toNumber(row.percentage),
    currencyCode:
      typeof row.currencyCode === 'string'
        ? row.currencyCode
        : typeof currency?.code === 'string'
          ? currency.code
          : undefined,
    chargeCalculationType: enumOption(row.chargeCalculationType),
    chargeTimeType: enumOption(row.chargeTimeType)
  };
}

export async function getLoanAccountChargeTemplate(
  accountId: string | number
): Promise<{ chargeOptions: LoanAccountChargeTemplateOption[] }> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}/charges/template`);
  if (!raw || typeof raw !== 'object') {
    return { chargeOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const options = Array.isArray(row.chargeOptions) ? row.chargeOptions : [];
  const chargeOptions: LoanAccountChargeTemplateOption[] = [];
  for (const item of options) {
    const option = normalizeChargeTemplateOption(item);
    if (option) {
      chargeOptions.push(option);
    }
  }
  return { chargeOptions };
}

export async function createLoanAccountCharge(
  accountId: string | number,
  body: Record<string, unknown>
): Promise<{ resourceId?: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId?: number }>(`/loans/${accountId}/charges`, body);
}
