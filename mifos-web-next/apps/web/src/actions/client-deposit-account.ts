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
  getClientDepositAccountAndTemplate,
  getClientDepositAccountTemplate,
  updateClientDepositAccountRecord
} from '@/lib/fineract/client-deposit-accounts';
import { normalizeClientDepositAccountTemplate } from '@/lib/fineract/client-deposit-account-normalize';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { getServerSession } from '@/lib/session/server';
import type { TermDepositAccountKind } from '@/lib/fineract/deposit-account-display';
import { depositAccountPermission } from '@/lib/fineract/deposit-account-display';
import type { DepositFormState } from '@/components/clients/accounts/create-client-deposit-account-form-state';
import { emptyDepositForm } from '@/components/clients/accounts/create-client-deposit-account-form-state';

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

function numberField(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  return '';
}

function enumIdField(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const id = (value as { id?: unknown }).id;
  return numberField(id);
}

function depositFormFromAccountRaw(raw: unknown): DepositFormState {
  const form = emptyDepositForm();
  if (!raw || typeof raw !== 'object') {
    return form;
  }
  const row = raw as Record<string, unknown>;
  const timeline =
    row.timeline && typeof row.timeline === 'object'
      ? (row.timeline as Record<string, unknown>)
      : {};
  const submitted =
    fineractApiDateToFormString(
      timeline.submittedOnDate as number[] | string | undefined
    ) ?? '';

  const depositPeriodFrequency =
    row.depositPeriodFrequency ?? row.depositPeriodFrequencyType;

  return {
    ...form,
    productId: numberField(row.savingsProductId ?? row.productId),
    submittedOnDate: submitted,
    externalId: typeof row.externalId === 'string' ? row.externalId : '',
    fieldOfficerId: numberField(row.fieldOfficerId),
    depositAmount: numberField(row.depositAmount),
    depositPeriod: numberField(row.depositPeriod),
    depositPeriodFrequencyId: enumIdField(depositPeriodFrequency),
    recurringFrequency: numberField(row.recurringFrequency),
    recurringFrequencyType: enumIdField(row.recurringFrequencyType),
    mandatoryRecommendedDepositAmount: numberField(row.mandatoryRecommendedDepositAmount),
    isCalendarInherited: row.isCalendarInherited === true
  };
}

export async function loadClientDepositAccountEditSheetDataAction(
  kind: TermDepositAccountKind,
  accountId: string
): Promise<
  | { ok: true; template: Awaited<ReturnType<typeof normalizeClientDepositAccountTemplate>>; form: DepositFormState }
  | { ok: false; message: string }
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, depositAccountPermission(kind, 'UPDATE'));
    const raw = await getClientDepositAccountAndTemplate(kind, accountId);
    const template = normalizeClientDepositAccountTemplate(raw);
    return {
      ok: true,
      template,
      form: depositFormFromAccountRaw(raw)
    };
  } catch (err) {
    return toFineractActionError(err, 'Could not load the application for editing.');
  }
}

export async function updateClientDepositAccountAction(
  kind: TermDepositAccountKind,
  clientId: string,
  accountId: string,
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
    assertCan(session, depositAccountPermission(kind, 'UPDATE'));
    const response = await updateClientDepositAccountRecord(
      kind,
      clientId,
      accountId,
      parsed as CreateClientFixedDepositAccountInput | CreateClientRecurringDepositAccountInput
    );
    const segment =
      kind === 'fixedDeposit' ? 'fixed-deposits-accounts' : 'recurring-deposits-accounts';
    const listSegment = kind === 'fixedDeposit' ? 'fixed-deposits' : 'recurring-deposits';
    revalidatePath(`/clients/${clientId}/${segment}/${accountId}/general`);
    revalidatePath(`/clients/${clientId}/${listSegment}`);
    revalidatePath(`/clients/${clientId}`);
    return actionSuccessFromFineractCommand(response, {
      resourceId: response.resourceId ?? response.savingsId ?? Number(accountId)
    });
  } catch (err) {
    return toFineractActionError(err, 'Could not update the application.');
  }
}
