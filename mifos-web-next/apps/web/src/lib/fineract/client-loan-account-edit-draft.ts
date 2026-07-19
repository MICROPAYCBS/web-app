/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type {
  LoanAccountChargeItemInput,
  LoanCollateralItemInput
} from '@mifos/validation';
import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';
import {
  emptyLoanAccountDraft,
  loanAccountDraftFromTemplate
} from '@/lib/fineract/client-loan-account-draft';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeDateField(raw: unknown): number[] | string | undefined {
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    return raw as number[];
  }
  return undefined;
}

function mapChargesToDraft(raw: unknown): LoanAccountChargeItemInput[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const charges: LoanAccountChargeItemInput[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const nestedCharge =
      row.charge && typeof row.charge === 'object'
        ? (row.charge as Record<string, unknown>)
        : undefined;
    const chargeId = toNumber(row.chargeId) ?? toNumber(nestedCharge?.id);
    if (chargeId == null) {
      continue;
    }
    const loanChargeId = toNumber(row.id);
    charges.push({
      id:
        loanChargeId != null && loanChargeId !== chargeId ? loanChargeId : undefined,
      chargeId,
      amount: toNumber(row.amount) ?? 0,
      dueDate: fineractApiDateToFormString(normalizeDateField(row.dueDate)) ?? '',
      feeInterval: toNumber(row.feeInterval),
      feeOnMonthDay:
        typeof row.feeOnMonthDay === 'string' ? row.feeOnMonthDay : undefined
    });
  }

  return charges;
}

function mapCollateralToDraft(raw: unknown): LoanCollateralItemInput[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const collateral: LoanCollateralItemInput[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const type =
      row.type && typeof row.type === 'object'
        ? (row.type as Record<string, unknown>)
        : undefined;
    const collateralTypeId =
      toNumber(row.clientCollateralId) ??
      toNumber(type?.collateralId) ??
      toNumber(type?.id);
    if (collateralTypeId == null) {
      continue;
    }
    collateral.push({
      collateralTypeId,
      value: toNumber(row.quantity) ?? toNumber(row.value) ?? 0,
      description: typeof row.description === 'string' ? row.description : ''
    });
  }

  return collateral;
}

export function loanAccountDraftFromEditTemplate(
  raw: unknown,
  template: ClientLoanAccountTemplate
): LoanAccountDraft {
  const row =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const fromTemplate = loanAccountDraftFromTemplate(template);
  const timeline =
    row.timeline && typeof row.timeline === 'object'
      ? (row.timeline as Record<string, unknown>)
      : undefined;

  const submittedOnDate =
    fineractApiDateToFormString(
      normalizeDateField(row.submittedOnDate) ??
        normalizeDateField(timeline?.submittedOnDate)
    ) ?? fromTemplate.submittedOnDate;

  const expectedDisbursementDate =
    fineractApiDateToFormString(
      normalizeDateField(row.expectedDisbursementDate) ??
        normalizeDateField(timeline?.expectedDisbursementDate)
    ) ?? fromTemplate.expectedDisbursementDate;

  const repaymentsStartingFromDate =
    fineractApiDateToFormString(normalizeDateField(row.repaymentsStartingFromDate)) ??
    '';

  const floating =
    template.linkedToFloatingInterestRates === true ||
    template.isLoanProductLinkedToFloatingRate === true;

  const enableDownPayment =
    template.enableDownPayment === true
      ? row.enableDownPayment === false
        ? false
        : true
      : undefined;

  return {
    ...fromTemplate,
    productId: template.product?.id ?? fromTemplate.productId,
    loanOfficerId: toNumber(row.loanOfficerId) ?? fromTemplate.loanOfficerId,
    loanPurposeId: toNumber(row.loanPurposeId),
    fundId: toNumber(row.fundId),
    externalId: typeof row.externalId === 'string' ? row.externalId : '',
    principal: toNumber(row.principal) ?? fromTemplate.principal,
    loanTermFrequency: toNumber(row.loanTermFrequency) ?? toNumber(row.termFrequency) ?? fromTemplate.loanTermFrequency,
    loanTermFrequencyType:
      toNumber(
        typeof row.loanTermFrequencyType === 'object'
          ? (row.loanTermFrequencyType as { id?: number }).id
          : row.loanTermFrequencyType
      ) ??
      toNumber(
        typeof row.termPeriodFrequencyType === 'object'
          ? (row.termPeriodFrequencyType as { id?: number }).id
          : row.termPeriodFrequencyType
      ) ??
      fromTemplate.loanTermFrequencyType,
    numberOfRepayments: toNumber(row.numberOfRepayments) ?? fromTemplate.numberOfRepayments,
    repaymentEvery: toNumber(row.repaymentEvery) ?? fromTemplate.repaymentEvery,
    repaymentFrequencyType:
      toNumber(
        typeof row.repaymentFrequencyType === 'object'
          ? (row.repaymentFrequencyType as { id?: number }).id
          : row.repaymentFrequencyType
      ) ?? fromTemplate.repaymentFrequencyType,
    interestRatePerPeriod:
      toNumber(row.interestRatePerPeriod) ?? fromTemplate.interestRatePerPeriod,
    interestRateDifferential:
      toNumber(row.interestRateDifferential) ?? fromTemplate.interestRateDifferential,
    isFloatingInterestRate: floating ? row.isFloatingInterestRate !== false : undefined,
    submittedOnDate,
    expectedDisbursementDate,
    repaymentsStartingFromDate,
    graceOnPrincipalPayment:
      toNumber(row.graceOnPrincipalPayment) ?? fromTemplate.graceOnPrincipalPayment,
    graceOnInterestPayment:
      toNumber(row.graceOnInterestPayment) ?? fromTemplate.graceOnInterestPayment,
    graceOnInterestCharged:
      toNumber(row.graceOnInterestCharged) ?? fromTemplate.graceOnInterestCharged,
    amortizationType:
      toNumber(
        typeof row.amortizationType === 'object'
          ? (row.amortizationType as { id?: number }).id
          : row.amortizationType
      ) ?? fromTemplate.amortizationType,
    interestType: floating
      ? 0
      : toNumber(
          typeof row.interestType === 'object'
            ? (row.interestType as { id?: number }).id
            : row.interestType
        ) ?? fromTemplate.interestType,
    interestCalculationPeriodType:
      toNumber(
        typeof row.interestCalculationPeriodType === 'object'
          ? (row.interestCalculationPeriodType as { id?: number }).id
          : row.interestCalculationPeriodType
      ) ?? fromTemplate.interestCalculationPeriodType,
    transactionProcessingStrategyCode:
      typeof row.transactionProcessingStrategyCode === 'string'
        ? row.transactionProcessingStrategyCode
        : fromTemplate.transactionProcessingStrategyCode,
    enableDownPayment,
    charges: mapChargesToDraft(row.charges),
    collateral: mapCollateralToDraft(row.collateral),
    guarantors: [],
    linkAccountId: toNumber(row.linkAccountId),
    createStandingInstructionAtDisbursement:
      row.createStandingInstructionAtDisbursement === true
  };
}

export function loanAccountIsModifiableStatus(status: {
  value?: string;
  submittedAndPendingApproval?: boolean;
  pendingApproval?: boolean;
}): boolean {
  if (status.submittedAndPendingApproval === true || status.pendingApproval === true) {
    return true;
  }
  return status.value === 'Submitted and pending approval';
}

/** Guard for edit flows when account detail is not yet loaded. */
export function emptyLoanAccountEditDraft(): LoanAccountDraft {
  return emptyLoanAccountDraft();
}
