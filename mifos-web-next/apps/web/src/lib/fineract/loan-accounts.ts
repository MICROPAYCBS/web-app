import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientAccountStatus, FineractCurrencyOption } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

export interface FineractLoanAccountDetail {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId?: number;
  clientName?: string;
  loanProductId?: number;
  loanProductName?: string;
  productName?: string;
  status: FineractClientAccountStatus;
  currency: FineractCurrencyOption;
  loanOfficerId?: number;
  loanOfficerName?: string;
  principal?: number;
  summary?: {
    principalOutstanding?: number;
    totalOutstanding?: number;
  };
}

function normalizeStatus(raw: unknown): FineractClientAccountStatus | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const value = typeof row.value === 'string' ? row.value : undefined;
  if (!Number.isFinite(id) || !value) {
    return undefined;
  }
  return {
    id,
    code: typeof row.code === 'string' ? row.code : undefined,
    value,
    active: row.active === true,
    submittedAndPendingApproval: row.submittedAndPendingApproval === true,
    pendingApproval: row.pendingApproval === true
  };
}

function normalizeCurrency(raw: unknown): FineractCurrencyOption | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const code = typeof row.code === 'string' ? row.code : undefined;
  if (!code) {
    return undefined;
  }
  return {
    code,
    name: typeof row.name === 'string' ? row.name : code,
    decimalPlaces: typeof row.decimalPlaces === 'number' ? row.decimalPlaces : undefined
  };
}

function normalizeLoanAccountDetail(raw: unknown): FineractLoanAccountDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const accountNo = typeof row.accountNo === 'string' ? row.accountNo : '';
  const status = normalizeStatus(row.status);
  const currency = normalizeCurrency(row.currency);
  if (!Number.isFinite(id) || !accountNo || !status || !currency) {
    return null;
  }

  const summaryRaw = row.summary;
  const summary =
    summaryRaw && typeof summaryRaw === 'object'
      ? {
          principalOutstanding:
            typeof (summaryRaw as Record<string, unknown>).principalOutstanding === 'number'
              ? ((summaryRaw as Record<string, unknown>).principalOutstanding as number)
              : undefined,
          totalOutstanding:
            typeof (summaryRaw as Record<string, unknown>).totalOutstanding === 'number'
              ? ((summaryRaw as Record<string, unknown>).totalOutstanding as number)
              : undefined
        }
      : undefined;

  return {
    id,
    accountNo,
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined,
    clientId: Number.isFinite(Number(row.clientId)) ? Number(row.clientId) : undefined,
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    loanProductId: Number.isFinite(Number(row.loanProductId))
      ? Number(row.loanProductId)
      : undefined,
    loanProductName:
      typeof row.loanProductName === 'string' ? row.loanProductName : undefined,
    productName:
      typeof row.productName === 'string'
        ? row.productName
        : typeof row.loanProductName === 'string'
          ? row.loanProductName
          : undefined,
    status,
    currency,
    loanOfficerId: Number.isFinite(Number(row.loanOfficerId))
      ? Number(row.loanOfficerId)
      : undefined,
    loanOfficerName:
      typeof row.loanOfficerName === 'string' ? row.loanOfficerName : undefined,
    principal:
      typeof row.principal === 'number'
        ? row.principal
        : Number.isFinite(Number(row.principal))
          ? Number(row.principal)
          : undefined,
    summary
  };
}

export async function getLoanAccount(
  accountId: string | number
): Promise<FineractLoanAccountDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}`, {
    associations: 'all'
  });
  return normalizeLoanAccountDetail(raw);
}

export async function getLoanOfficerAssignTemplate(
  accountId: string | number
): Promise<{ loanOfficerId?: number; loanOfficerOptions: { id: number; name: string }[] }> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/loans/${accountId}`, {
    template: 'true',
    fields: 'id,loanOfficerId,loanOfficerOptions'
  });
  if (!raw || typeof raw !== 'object') {
    return { loanOfficerOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const loanOfficerId = Number.isFinite(Number(row.loanOfficerId))
    ? Number(row.loanOfficerId)
    : undefined;
  const options = Array.isArray(row.loanOfficerOptions)
    ? row.loanOfficerOptions
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const option = item as Record<string, unknown>;
          const id = Number(option.id);
          if (!Number.isFinite(id)) {
            return null;
          }
          const name =
            typeof option.displayName === 'string'
              ? option.displayName
              : typeof option.firstname === 'string'
                ? option.firstname
                : `Loan officer ${id}`;
          return { id, name };
        })
        .filter((item): item is { id: number; name: string } => item !== null)
    : [];
  return { loanOfficerId, loanOfficerOptions: options };
}

export async function executeLoanAccountCommand(
  accountId: string | number,
  command: 'assignLoanOfficer' | 'unassignLoanOfficer',
  body: Record<string, unknown>
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`/loans/${accountId}`, body, { command });
}
