'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import type { ClientDepositAccountKind } from '@mifos/api-client';
import {
  createClientFixedDepositAccountSchema,
  createClientRecurringDepositAccountSchema,
  createClientSavingsAccountSchema,
  toFineractActionError,
  type CreateClientFixedDepositAccountInput,
  type CreateClientRecurringDepositAccountInput,
  type CreateClientSavingsAccountInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  CLIENT_DEPOSIT_ACCOUNT_CONFIG,
  clientDepositAccountCreatePath
} from '@/lib/fineract/client-deposit-account-config';
import {
  type ClientDepositAccountActionResult,
  isClientDepositAccountActionError
} from '@/lib/fineract/client-account-action-result';
import {
  createClientDepositAccountRecord,
  getClientDepositAccountTemplate
} from '@/lib/fineract/client-deposit-accounts';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { getServerSession } from '@/lib/session/server';

type CreateClientDepositAccountInput =
  | CreateClientSavingsAccountInput
  | CreateClientFixedDepositAccountInput
  | CreateClientRecurringDepositAccountInput;

function parseDepositInput(
  kind: ClientDepositAccountKind,
  raw: unknown
): Extract<ClientDepositAccountActionResult, { ok: false }> | CreateClientDepositAccountInput {
  const schema =
    kind === 'savings'
      ? createClientSavingsAccountSchema
      : kind === 'fixedDeposit'
        ? createClientFixedDepositAccountSchema
        : createClientRecurringDepositAccountSchema;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return parsed.data;
}

export async function fetchClientDepositAccountTemplateAction(
  kind: ClientDepositAccountKind,
  clientId: string,
  productId?: string
) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' } satisfies ClientDepositAccountActionResult;
  }
  try {
    assertCan(session, CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].permission);
    return await getClientDepositAccountTemplate(kind, clientId, productId);
  } catch (err) {
    return toFineractActionError(err, 'Could not load application template.');
  }
}

export async function createClientDepositAccountAction(
  kind: ClientDepositAccountKind,
  clientId: string,
  raw: unknown
): Promise<ClientDepositAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  const parsed = parseDepositInput(kind, raw);
  if (isClientDepositAccountActionError(parsed)) {
    return parsed;
  }

  try {
    assertCan(session, CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].permission);
    const response = await createClientDepositAccountRecord(kind, clientId, parsed);
    const resourceId = response.resourceId ?? response.savingsId;
    revalidatePath(clientAccountListPath(clientId, CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind].listKind));
    revalidatePath(clientDepositAccountCreatePath(clientId, kind));
    revalidatePath(`/clients/${clientId}`);
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (err) {
    return toFineractActionError(err, 'Could not submit the application.');
  }
}
