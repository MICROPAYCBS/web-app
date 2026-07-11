'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  expandBulkConstructJournalEntries,
  toFineractActionError,
  validateBulkConstructJournalEntriesForm,
  validateCreateJournalEntryForm,
  validateRevertJournalEntry,
  type BulkConstructJournalEntriesFormInput,
  type CreateJournalEntryFormInput,
  type RevertJournalEntryInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  createJournalEntry,
  getJournalEntryTransaction,
  listJournalEntryGlAccounts,
  revertJournalEntryTransaction
} from '@/lib/fineract/journal-entries';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { getServerSession } from '@/lib/session/server';
import { listAccountingRulesForFrequentPostings } from '@/lib/fineract/accounting-rules';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';
import { expandBulkConstructRowToJournalEntry } from '@/lib/accounting/bulk-journal-construct';

const LIST_PATH = '/accounting/journal-entries';
const BULK_OPERATIONS_PATH = '/accounting/journal-entries/bulk-operations';
const REQUIRE_DEPARTMENT_CONFIG = 'enable-require-department-on-manual-journal-pl-lines';

export type JournalEntriesActionResult =
  | { ok: true; transactionId?: string; pendingChecker?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type GetJournalEntryTransactionResult =
  | { ok: true; entries: FineractJournalEntryListItem[] }
  | { ok: false; message: string };

export type BulkJournalEntriesRowResult =
  | { rowIndex: number; ok: true; transactionId?: string; pending?: boolean }
  | { rowIndex: number; ok: false; message: string };

export type BulkJournalEntriesActionResult =
  | {
      ok: true;
      results: BulkJournalEntriesRowResult[];
      successCount: number;
      failureCount: number;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function transactionPath(transactionId: string) {
  return `${LIST_PATH}/transactions/${transactionId}`;
}

function zodFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || 'form';
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function revalidateJournalEntryViews(transactionId?: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(BULK_OPERATIONS_PATH);
  if (transactionId) {
    revalidatePath(transactionPath(transactionId));
  }
}

async function loadJournalEntryValidationContext() {
  const [departmentConfig, glAccounts] = await Promise.all([
    getGlobalConfigurationByName(REQUIRE_DEPARTMENT_CONFIG),
    listJournalEntryGlAccounts()
  ]);
  const glAccountTypesById = Object.fromEntries(
    glAccounts
      .filter((account) => account.typeId != null)
      .map((account) => [account.id, account.typeId as number])
  );
  return {
    requireDepartmentOnPlLines: departmentConfig?.enabled ?? false,
    glAccountTypesById
  };
}

export async function createJournalEntryAction(
  input: CreateJournalEntryFormInput
): Promise<JournalEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to create journal entries.' };
  }

  const validationContext = await loadJournalEntryValidationContext();

  const parsed = validateCreateJournalEntryForm(input, validationContext);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createJournalEntry(parsed.data);
    revalidateJournalEntryViews(response.transactionId);
    return actionSuccessFromFineractCommand(response, { transactionId: response.transactionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create journal entry.');
  }
}

export async function createBulkJournalEntriesAction(
  input: BulkConstructJournalEntriesFormInput
): Promise<BulkJournalEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to create journal entries.' };
  }

  const [validationContext, accountingRules, currencies] = await Promise.all([
    loadJournalEntryValidationContext(),
    listAccountingRulesForFrequentPostings(),
    getOrganizationSelectedCurrencies()
  ]);

  const ruleById = new Map(accountingRules.map((rule) => [rule.id, rule]));

  const parsed = validateBulkConstructJournalEntriesForm(input, {
    ...validationContext,
    expandEntry: (template, row) => {
      const rule = ruleById.get(template.accountingRuleId);
      if (!rule) {
        return null;
      }
      return expandBulkConstructRowToJournalEntry(template, row, rule, currencies);
    }
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const expanded = expandBulkConstructJournalEntries(parsed.data, (template, row) => {
    const rule = ruleById.get(template.accountingRuleId);
    if (!rule) {
      return null;
    }
    return expandBulkConstructRowToJournalEntry(template, row, rule, currencies);
  });

  const results: BulkJournalEntriesRowResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const { rowIndex, entry } of expanded) {
    try {
      const response = await createJournalEntry(entry);
      const outcome = actionSuccessFromFineractCommand(response, {
        transactionId: response.transactionId
      });
      if (outcome.ok) {
        successCount += 1;
        results.push({
          rowIndex,
          ok: true,
          transactionId: response.transactionId,
          pending: outcome.pendingChecker === true
        });
      } else {
        failureCount += 1;
        results.push({
          rowIndex,
          ok: false,
          message: 'Failed to create journal entry.'
        });
      }
    } catch (error) {
      failureCount += 1;
      const mapped = toFineractActionError(error, 'Failed to create journal entry.');
      results.push({
        rowIndex,
        ok: false,
        message: mapped.ok === false ? mapped.message : 'Failed to create journal entry.'
      });
    }
  }

  revalidateJournalEntryViews();

  return {
    ok: true,
    results,
    successCount,
    failureCount
  };
}

export async function getJournalEntryTransactionAction(
  transactionId: string
): Promise<GetJournalEntryTransactionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to view journal entries.' };
  }

  if (!transactionId.trim()) {
    return { ok: false, message: 'Invalid transaction id.' };
  }

  try {
    const page = await getJournalEntryTransaction(transactionId);
    return { ok: true, entries: page.pageItems };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load journal transaction.');
  }
}

export async function revertJournalEntryAction(
  transactionId: string,
  input: RevertJournalEntryInput
): Promise<JournalEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'REVERSE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to reverse journal entries.' };
  }

  if (!transactionId.trim()) {
    return { ok: false, message: 'Invalid transaction id.' };
  }

  const parsed = validateRevertJournalEntry(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid request.' };
  }

  try {
    const response = await revertJournalEntryTransaction(transactionId, parsed.data);
    revalidateJournalEntryViews(response.transactionId);
    return actionSuccessFromFineractCommand(response, { transactionId: response.transactionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to reverse journal entry.');
  }
}
