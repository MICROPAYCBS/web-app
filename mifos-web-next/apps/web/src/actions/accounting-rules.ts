'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateUpsertAccountingRuleForm,
  type UpsertAccountingRuleFormInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createAccountingRule,
  deleteAccountingRule,
  updateAccountingRule
} from '@/lib/fineract/accounting-rules';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/accounting-rules';

export type AccountingRulesActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function accountingRulePath(accountingRuleId: number | string) {
  return `${LIST_PATH}/${accountingRuleId}`;
}

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateAccountingRuleViews(accountingRuleId?: number) {
  revalidatePath(LIST_PATH);
  if (accountingRuleId != null) {
    revalidatePath(accountingRulePath(accountingRuleId));
    revalidatePath(`${accountingRulePath(accountingRuleId)}/edit`);
  }
}

export async function createAccountingRuleAction(
  input: UpsertAccountingRuleFormInput
): Promise<AccountingRulesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_ACCOUNTINGRULE');
  } catch {
    return { ok: false, message: 'You do not have permission to create accounting rules.' };
  }

  const parsed = validateUpsertAccountingRuleForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createAccountingRule(parsed.data);
    revalidateAccountingRuleViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create accounting rule.');
  }
}

export async function updateAccountingRuleAction(
  accountingRuleId: number,
  input: UpsertAccountingRuleFormInput
): Promise<AccountingRulesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_ACCOUNTINGRULE');
  } catch {
    return { ok: false, message: 'You do not have permission to update accounting rules.' };
  }

  const parsed = validateUpsertAccountingRuleForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateAccountingRule(accountingRuleId, parsed.data);
    revalidateAccountingRuleViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update accounting rule.');
  }
}

export async function deleteAccountingRuleAction(
  accountingRuleId: number
): Promise<AccountingRulesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_ACCOUNTINGRULE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete accounting rules.' };
  }

  try {
    const response = await deleteAccountingRule(accountingRuleId);
    revalidateAccountingRuleViews();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete accounting rule.');
  }
}
