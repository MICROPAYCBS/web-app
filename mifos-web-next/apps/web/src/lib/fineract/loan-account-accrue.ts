/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { translateFineractCode } from '@mifos/i18n';
import { startOfDay } from 'date-fns';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { fineractDateToDate } from '@/lib/fineract/date-input';

const PERIODIC_ACCRUAL_ACCOUNTING_CODE = 'accountingruletype.accrual.periodic';
const CONTRACT_TERMINATION_SUB_STATUS_ID = 900;
const ACTIVE_LOAN_STATUS_ID = 300;
const PROGRESSIVE_SCHEDULE_TYPE_ID = 2;

export interface LoanAccountAccrueStatus {
  id?: number;
  code?: string;
}

export interface LoanAccountAccrueAccount {
  status: LoanAccountAccrueStatus;
  isNPA?: boolean;
  chargedOff?: boolean;
  subStatus?: { id?: number; code?: string };
  loanScheduleType?: { id?: number; code?: string; value?: string };
  interestRecalculationData?: {
    isCompoundingToBePostedAsTransaction?: boolean;
  };
}

export interface LoanAccountAccrueAccountingRule {
  id?: number;
  code?: string;
}

export interface LoanAccountAccrueEligibility {
  show: boolean;
  /** Cumulative loan that posts compounding income. Till date is ignored. */
  omitTillDate: boolean;
}

const HIDDEN_ACCRUE: LoanAccountAccrueEligibility = { show: false, omitTillDate: false };

export function isPeriodicAccrualAccounting(
  rule?: LoanAccountAccrueAccountingRule | null
): boolean {
  if (!rule) {
    return false;
  }
  if (rule.id === 3) {
    return true;
  }
  const code = rule.code?.trim().toLowerCase() ?? '';
  return code === PERIODIC_ACCRUAL_ACCOUNTING_CODE || code.endsWith('accrual.periodic');
}

export function isProgressiveLoanSchedule(
  schedule?: { id?: number; code?: string; value?: string }
): boolean {
  if (!schedule) {
    return false;
  }
  if (schedule.id === PROGRESSIVE_SCHEDULE_TYPE_ID) {
    return true;
  }
  const code = schedule.code?.trim().toLowerCase() ?? '';
  if (code === 'progressive' || code.endsWith('.progressive')) {
    return true;
  }
  return schedule.value?.trim().toLowerCase() === 'progressive';
}

export function isLoanContractTerminated(subStatus?: { id?: number; code?: string }): boolean {
  if (!subStatus) {
    return false;
  }
  if (subStatus.id === CONTRACT_TERMINATION_SUB_STATUS_ID) {
    return true;
  }
  const code = subStatus.code?.trim().toLowerCase() ?? '';
  return code === 'loansubstatustype.contracttermination' || code.endsWith('contracttermination');
}

export function isActiveLoanForAccrual(status: LoanAccountAccrueStatus): boolean {
  if (status.id != null) {
    return status.id === ACTIVE_LOAN_STATUS_ID;
  }
  const code = status.code?.trim().toLowerCase() ?? '';
  return code === 'loanstatustype.active';
}

function postsCompoundingAsTransaction(account: LoanAccountAccrueAccount): boolean {
  return account.interestRecalculationData?.isCompoundingToBePostedAsTransaction === true;
}

/** Whether Accrue can be offered, and whether the till-date field must stay hidden. */
export function loanAccountAccrueEligibility(
  account: LoanAccountAccrueAccount,
  accountingRule?: LoanAccountAccrueAccountingRule | null
): LoanAccountAccrueEligibility {
  if (!isActiveLoanForAccrual(account.status)) {
    return HIDDEN_ACCRUE;
  }
  if (!isPeriodicAccrualAccounting(accountingRule)) {
    return HIDDEN_ACCRUE;
  }
  if (account.isNPA === true || account.chargedOff === true) {
    return HIDDEN_ACCRUE;
  }
  if (isLoanContractTerminated(account.subStatus)) {
    return HIDDEN_ACCRUE;
  }
  const compounding = postsCompoundingAsTransaction(account);
  if (isProgressiveLoanSchedule(account.loanScheduleType) && compounding) {
    return HIDDEN_ACCRUE;
  }
  return { show: true, omitTillDate: compounding };
}

export type LoanAccountAccrueRequest =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; message: string; field: 'tillDate' };

/** Empty body accrues through the business date. An earlier till date is sent explicitly. */
export function loanAccountAccrueRequestBody(input: {
  tillDate?: string;
  businessDate?: string;
  omitTillDate: boolean;
}): LoanAccountAccrueRequest {
  if (input.omitTillDate) {
    return { ok: true, body: {} };
  }

  const tillDate = input.tillDate?.trim();
  if (!tillDate) {
    return { ok: true, body: {} };
  }

  const businessDate = input.businessDate?.trim();
  if (businessDate) {
    const selected = fineractDateToDate(tillDate);
    const cap = fineractDateToDate(businessDate);
    if (selected && cap) {
      const selectedDay = startOfDay(selected).getTime();
      const capDay = startOfDay(cap).getTime();
      if (selectedDay > capDay) {
        return {
          ok: false,
          field: 'tillDate',
          message: translateFineractCode('validation.msg.loan.tillDate.is.greater.than.date')
        };
      }
      if (selectedDay === capDay) {
        return { ok: true, body: {} };
      }
    }
  }

  return {
    ok: true,
    body: {
      locale: FINERACT_LOCALE,
      dateFormat: FINERACT_DATE_FORMAT,
      tillDate
    }
  };
}
