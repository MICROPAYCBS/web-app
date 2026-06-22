import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  AccountTransferTemplate,
  CreateAccountTransferResponse
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  normalizeFineractDateField,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';
import { SAVINGS_PORTFOLIO_ACCOUNT_TYPE } from '@/lib/fineract/portfolio-account-types';

export { SAVINGS_PORTFOLIO_ACCOUNT_TYPE };

export type AccountTransferTemplateQuery = {
  fromAccountId: string | number;
  fromAccountType?: string | number;
  /** Partial beneficiary fields forwarded to refresh dependent dropdowns. */
  cascade?: Record<string, string | number | undefined>;
};

export type AccountTransferBodyFields = {
  toOfficeId: number;
  toClientId: number;
  toAccountType: number;
  toAccountId: number;
  transferDate: string;
  transferAmount: number;
  transferDescription: string;
};

function toSearchParams(
  entries: Record<string, string | number | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    out[key] = String(value);
  }
  return out;
}

export async function getAccountTransferTemplate(
  query: AccountTransferTemplateQuery
): Promise<AccountTransferTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<AccountTransferTemplate>('/accounttransfers/template', {
    fromAccountId: String(query.fromAccountId),
    fromAccountType: String(query.fromAccountType ?? SAVINGS_PORTFOLIO_ACCOUNT_TYPE),
    ...toSearchParams(query.cascade ?? {})
  });
}

export function accountTransferAvailableBalance(template: AccountTransferTemplate): number {
  const fromAccount = template.fromAccount as
    | (NonNullable<AccountTransferTemplate['fromAccount']> & {
        accountBalance?: number;
        balance?: number;
      })
    | undefined;
  if (!fromAccount) {
    return 0;
  }
  return (
    fromAccount.availableBalance ??
    fromAccount.summary?.availableBalance ??
    fromAccount.summary?.accountBalance ??
    fromAccount.accountBalance ??
    fromAccount.balance ??
    0
  );
}

export function buildCreateAccountTransferBody(
  input: AccountTransferBodyFields,
  context: {
    fromAccountId: string | number;
    fromAccountType: number;
    fromClientId: string | number;
    fromOfficeId: string | number;
    dateFormat?: string;
    locale?: string;
  }
): Record<string, unknown> {
  const dateCtx = resolveFineractDateContext({
    dateFormat: context.dateFormat,
    locale: context.locale
  });

  return {
    toOfficeId: input.toOfficeId,
    toClientId: input.toClientId,
    toAccountType: input.toAccountType,
    toAccountId: input.toAccountId,
    transferDate: normalizeFineractDateField(input.transferDate, dateCtx),
    transferAmount: input.transferAmount,
    transferDescription: input.transferDescription,
    fromAccountId: Number(context.fromAccountId),
    fromAccountType: context.fromAccountType,
    fromClientId: Number(context.fromClientId),
    fromOfficeId: Number(context.fromOfficeId),
    dateFormat: dateCtx.dateFormat,
    locale: dateCtx.locale
  };
}

export async function createAccountTransfer(
  body: Record<string, unknown>
): Promise<CreateAccountTransferResponse> {
  const fineract = await createFineractClient();
  return fineract.post<CreateAccountTransferResponse>('/accounttransfers', body);
}

export async function undoAccountTransfer(transferId: string | number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`/accounttransfers/${transferId}`, {}, { command: 'undo' });
}
