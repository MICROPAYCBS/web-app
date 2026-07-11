'use server';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  toFineractActionError,
  validateCentralBranchExpensePaymentForm,
  validateCreateJournalEntryForm,
  type CentralBranchExpensePaymentFormInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { expandCentralBranchExpensePayment } from '@/lib/accounting/central-branch-expense-payment';
import { resolveCentralBranchClearingGlAccount } from '@/lib/accounting/inter-branch-recon';
import {
  createJournalEntry,
  listJournalEntryGlAccounts,
  revertJournalEntryTransaction
} from '@/lib/fineract/journal-entries';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { listFinancialActivityMappings } from '@/lib/fineract/financial-activity-mappings';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/journal-entries';
const WIZARD_PATH = '/accounting/journal-entries/central-branch-payment';
const REQUIRE_DEPARTMENT_CONFIG = 'enable-require-department-on-manual-journal-pl-lines';

export type CentralBranchExpensePaymentRowResult =
  | {
      step: number;
      role: 'branch_expense' | 'ho_funding';
      officeId: number;
      officeName: string;
      ok: true;
      transactionId?: string;
      pending?: boolean;
    }
  | {
      step: number;
      role: 'branch_expense' | 'ho_funding';
      officeId: number;
      officeName: string;
      ok: false;
      message: string;
    };

export type CreateCentralBranchExpensePaymentResult =
  | {
      ok: true;
      results: CentralBranchExpensePaymentRowResult[];
      successCount: number;
      failureCount: number;
      referenceNumber: string;
    }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type ReverseCentralBranchExpensePaymentResult =
  | {
      ok: true;
      results: Array<
        | { transactionId: string; ok: true }
        | { transactionId: string; ok: false; message: string }
      >;
    }
  | { ok: false; message: string };

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

async function loadJournalEntryValidationContext() {
  const [departmentConfig, glAccounts, financialActivityMappings] = await Promise.all([
    getGlobalConfigurationByName(REQUIRE_DEPARTMENT_CONFIG),
    listJournalEntryGlAccounts(),
    listFinancialActivityMappings()
  ]);
  const glAccountTypesById = Object.fromEntries(
    glAccounts
      .filter((account) => account.typeId != null)
      .map((account) => [account.id, account.typeId as number])
  );
  return {
    requireDepartmentOnPlLines: departmentConfig?.enabled ?? false,
    glAccountTypesById,
    glAccounts,
    financialActivityMappings
  };
}

function revalidateCentralBranchPaymentViews(transactionIds: string[] = []) {
  revalidatePath(LIST_PATH);
  revalidatePath(WIZARD_PATH);
  for (const transactionId of transactionIds) {
    if (transactionId) {
      revalidatePath(`${LIST_PATH}/transactions/${transactionId}`);
    }
  }
}

export async function createCentralBranchExpensePaymentAction(
  input: CentralBranchExpensePaymentFormInput
): Promise<CreateCentralBranchExpensePaymentResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to create journal entries.' };
  }

  const validationContext = await loadJournalEntryValidationContext();
  const parsed = validateCentralBranchExpensePaymentForm(input, {
    requireDepartmentOnExpenseLines: validationContext.requireDepartmentOnPlLines
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  const clearing = resolveCentralBranchClearingGlAccount(
    validationContext.financialActivityMappings,
    validationContext.glAccounts
  );
  if (clearing.clearingGlAccountId == null) {
    return {
      ok: false,
      message: clearing.warning ?? 'Inter-branch reconciliation is not configured.'
    };
  }

  const offices = await listOfficeOptions();
  const officeNamesById = Object.fromEntries(
    offices.map((office) => [office.id, office.name ?? office.nameDecorated ?? String(office.id)])
  );

  const expanded = expandCentralBranchExpensePayment({
    ...parsed.data,
    clearingGlAccountId: clearing.clearingGlAccountId,
    officeNamesById
  });

  const results: CentralBranchExpensePaymentRowResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  const postedTransactionIds: string[] = [];

  for (const entry of expanded) {
    const validated = validateCreateJournalEntryForm(entry.input, validationContext);
    if (!validated.success) {
      failureCount += 1;
      results.push({
        step: entry.step,
        role: entry.role,
        officeId: entry.officeId,
        officeName: entry.officeName,
        ok: false,
        message: 'Generated journal entry failed validation.'
      });
      break;
    }

    try {
      const response = await createJournalEntry(validated.data);
      const outcome = actionSuccessFromFineractCommand(response, {
        transactionId: response.transactionId
      });
      if (!outcome.ok) {
        failureCount += 1;
        results.push({
          step: entry.step,
          role: entry.role,
          officeId: entry.officeId,
          officeName: entry.officeName,
          ok: false,
          message: 'Failed to create journal entry.'
        });
        break;
      }
      successCount += 1;
      if (response.transactionId) {
        postedTransactionIds.push(response.transactionId);
      }
      results.push({
        step: entry.step,
        role: entry.role,
        officeId: entry.officeId,
        officeName: entry.officeName,
        ok: true,
        transactionId: response.transactionId,
        pending: outcome.pendingChecker === true
      });
    } catch (error) {
      failureCount += 1;
      const mapped = toFineractActionError(error, 'Failed to create journal entry.');
      results.push({
        step: entry.step,
        role: entry.role,
        officeId: entry.officeId,
        officeName: entry.officeName,
        ok: false,
        message: mapped.ok === false ? mapped.message : 'Failed to create journal entry.'
      });
      break;
    }
  }

  revalidateCentralBranchPaymentViews(postedTransactionIds);

  return {
    ok: true,
    results,
    successCount,
    failureCount,
    referenceNumber: parsed.data.referenceNumber
  };
}

const reverseBatchSchema = z.object({
  transactionIds: z.array(z.string().trim().min(1)).min(1)
});

export async function reverseCentralBranchExpensePaymentAction(
  input: unknown
): Promise<ReverseCentralBranchExpensePaymentResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'REVERSE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to reverse journal entries.' };
  }

  const parsed = reverseBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'No posted transactions to reverse.' };
  }

  const results: Array<
    { transactionId: string; ok: true } | { transactionId: string; ok: false; message: string }
  > = [];

  for (const transactionId of [...parsed.data.transactionIds].reverse()) {
    try {
      await revertJournalEntryTransaction(transactionId, {});
      results.push({ transactionId, ok: true });
    } catch (error) {
      const mapped = toFineractActionError(error, 'Failed to reverse journal entry.');
      results.push({
        transactionId,
        ok: false,
        message: mapped.ok === false ? mapped.message : 'Failed to reverse journal entry.'
      });
    }
  }

  revalidateCentralBranchPaymentViews(parsed.data.transactionIds);
  return { ok: true, results };
}
