'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import {
  loanGuarantorItemSchema,
  updateLoanGuarantorSchema,
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  createLoanGuarantor,
  deleteLoanGuarantor,
  getLoanGuaranteeSettings,
  getLoanGuarantorSavingsAccounts,
  getLoanGuarantorTemplate,
  getLoanGuarantors,
  listGuarantorGroupOptions,
  recoverLoanGuarantees,
  updateLoanGuarantor
} from '@/lib/fineract/loan-guarantors';
import { searchClientEntities } from '@/lib/fineract/search';
import { listStaff } from '@/lib/fineract/staff';
import { getServerSession } from '@/lib/session/server';

function parseWithSchema<T>(
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } } },
  raw: unknown
): LoanAccountActionResult | T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }
  return parsed.data;
}

async function requireKey(
  key:
    | 'loans.guarantors.create'
    | 'loans.guarantors.update'
    | 'loans.guarantors.delete'
    | 'loans.guarantors.recover',
  message: string
): Promise<LoanAccountActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission(key));
  } catch {
    return { ok: false, message };
  }
  return null;
}

export async function searchLoanGuarantorClientsAction(query: string): Promise<
  | {
      ok: true;
      clients: Array<{
        id: number;
        displayName: string;
        accountNo?: string;
        officeName?: string;
      }>;
    }
  | { ok: false; message: string }
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.list'));
  } catch {
    return { ok: false, message: 'You do not have permission to search customers.' };
  }

  try {
    const hits = await searchClientEntities(query, { limit: 20 });
    return {
      ok: true,
      clients: hits.map((hit) => ({
        id: hit.id,
        displayName: hit.displayName,
        accountNo: hit.accountNo,
        officeName: hit.officeName
      }))
    };
  } catch (err) {
    return toFineractActionError(err, 'Could not search customers.');
  }
}

export async function loadLoanGuarantorTemplateAction(
  accountId: number,
  loanProductId?: number
) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.guarantors'));
    const [template, staffResult, groupResult, guarantee, guarantors] = await Promise.all([
      getLoanGuarantorTemplate(accountId),
      listStaff().catch(() => []),
      listGuarantorGroupOptions().catch(() => []),
      loanProductId != null
        ? getLoanGuaranteeSettings(loanProductId).catch(() => ({ holdGuaranteeFunds: false }))
        : Promise.resolve({ holdGuaranteeFunds: false }),
      getLoanGuarantors(accountId).catch(() => [])
    ]);
    return {
      ok: true as const,
      ...template,
      guarantee,
      guarantors,
      staffOptions: staffResult
        .filter((member) => member.isActive !== false)
        .map((member) => ({
          id: member.id,
          name: [member.firstname, member.lastname].filter(Boolean).join(' ').trim() || `Staff ${member.id}`
        })),
      groupOptions: groupResult
    };
  } catch (err) {
    return toFineractActionError(err, 'Could not load guarantor types.');
  }
}

export async function loadLoanGuarantorSavingsAction(
  accountId: number,
  clientId: number
): Promise<
  | { ok: true; accounts: Awaited<ReturnType<typeof getLoanGuarantorSavingsAccounts>> }
  | { ok: false; message: string }
> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.guarantors'));
    const accounts = await getLoanGuarantorSavingsAccounts(accountId, clientId);
    return { ok: true, accounts };
  } catch (err) {
    return toFineractActionError(err, 'Could not load savings accounts to pledge.');
  }
}

export async function createLoanGuarantorAction(
  clientId: string,
  accountId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requireKey(
    'loans.guarantors.create',
    'You do not have permission to add guarantors.'
  );
  if (denied) {
    return denied;
  }
  const parsed = parseWithSchema(loanGuarantorItemSchema, raw);
  if (typeof parsed === 'object' && parsed && 'ok' in parsed) {
    return parsed;
  }
  try {
    const response = await createLoanGuarantor(accountId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function updateLoanGuarantorAction(
  clientId: string,
  accountId: number,
  guarantorId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requireKey(
    'loans.guarantors.update',
    'You do not have permission to update guarantors.'
  );
  if (denied) {
    return denied;
  }
  const parsed = parseWithSchema(updateLoanGuarantorSchema, raw);
  if (typeof parsed === 'object' && parsed && 'ok' in parsed) {
    return parsed;
  }
  try {
    const response = await updateLoanGuarantor(accountId, guarantorId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteLoanGuarantorAction(
  clientId: string,
  accountId: number,
  guarantorId: number,
  guarantorFundingId?: number
): Promise<LoanAccountActionResult> {
  const denied = await requireKey(
    'loans.guarantors.delete',
    'You do not have permission to remove guarantors.'
  );
  if (denied) {
    return denied;
  }
  try {
    const response = await deleteLoanGuarantor(accountId, guarantorId, guarantorFundingId);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function recoverLoanGuaranteesAction(
  clientId: string,
  accountId: number
): Promise<LoanAccountActionResult> {
  const denied = await requireKey(
    'loans.guarantors.recover',
    'You do not have permission to recover pledged savings.'
  );
  if (denied) {
    return denied;
  }
  try {
    const response = await recoverLoanGuarantees(accountId);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not recover pledged savings.');
  }
}
