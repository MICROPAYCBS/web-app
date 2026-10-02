'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { translateFineractCode } from '@mifos/i18n';
import {
  actionSuccessFromFineractCommand,
  loanAccountAccrueCommandSchema,
  toFineractActionError
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { getDefaultTransactionDate } from '@/lib/fineract/business-date';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import {
  isActiveLoanForAccrual,
  isLoanContractTerminated,
  isPeriodicAccrualAccounting,
  isProgressiveLoanSchedule,
  loanAccountAccrueEligibility,
  loanAccountAccrueRequestBody
} from '@/lib/fineract/loan-account-accrue';
import { executeLoanAccountAccrueCommand } from '@/lib/fineract/loan-account-commands';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import { getLoanProductAccountingRule } from '@/lib/fineract/loan-products';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import { getServerSession } from '@/lib/session/server';

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function accrueBlockedMessage(
  account: NonNullable<Awaited<ReturnType<typeof getLoanAccount>>>,
  accountingRule: { id?: number; code?: string } | null
): string | null {
  if (loanAccountAccrueEligibility(account, accountingRule).show) {
    return null;
  }
  if (!isActiveLoanForAccrual(account.status)) {
    return translateFineractCode('error.msg.loan.accrual.not.active');
  }
  if (!isPeriodicAccrualAccounting(accountingRule)) {
    return translateFineractCode('error.msg.loan.accrual.accounting.rule.not.periodic');
  }
  if (account.isNPA === true) {
    return translateFineractCode('error.msg.loan.accrual.npa');
  }
  if (account.chargedOff === true) {
    return translateFineractCode('error.msg.loan.accrual.charged.off');
  }
  if (isLoanContractTerminated(account.subStatus)) {
    return translateFineractCode('error.msg.loan.accrual.contract.terminated');
  }
  if (
    isProgressiveLoanSchedule(account.loanScheduleType) &&
    account.interestRecalculationData?.isCompoundingToBePostedAsTransaction === true
  ) {
    return translateFineractCode('error.msg.loan.accrual.progressive.compounding.unsupported');
  }
  return translateFineractCode('validation.msg.loan.accrual.execution.failed');
}

export async function executeLoanAccountAccrueAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('loans.accrue'));
    assertCan(session, resolvePermission('products.loan'));
  } catch {
    return { ok: false, message: 'You do not have permission to accrue this loan.' };
  }

  const parsed = loanAccountAccrueCommandSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error.issues)
    };
  }

  try {
    const account = await getLoanAccount(accountId);
    if (!account) {
      return { ok: false, message: 'This loan could not be found.' };
    }
    if (account.loanProductId == null) {
      return {
        ok: false,
        message: translateFineractCode('error.msg.loan.accrual.accounting.rule.not.periodic')
      };
    }

    const accountingRule = await getLoanProductAccountingRule(account.loanProductId);
    const blocked = accrueBlockedMessage(account, accountingRule);
    if (blocked) {
      return { ok: false, message: blocked };
    }

    const eligibility = loanAccountAccrueEligibility(account, accountingRule);
    const businessDate = await getDefaultTransactionDate();
    const request = loanAccountAccrueRequestBody({
      tillDate: parsed.data.tillDate,
      businessDate,
      omitTillDate: eligibility.omitTillDate
    });
    if (!request.ok) {
      return {
        ok: false,
        message: request.message,
        fieldErrors: { [request.field]: request.message }
      };
    }

    const response = await executeLoanAccountAccrueCommand(accountId, request.body);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    revalidatePath(`/clients/${clientId}/loans`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, translateFineractCode('validation.msg.loan.accrual.execution.failed'));
  }
}
