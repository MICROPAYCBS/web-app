/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateLoanAccountInput } from '@mifos/validation';
import { emptyLoanAccountDraft, type LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';

function normalizeEntity(entityName?: string | null): string {
  return (entityName ?? '').trim().toUpperCase().replace(/[\s_-]+/g, '');
}

export function isLoanCheckerEntity(entityName?: string | null): boolean {
  return normalizeEntity(entityName) === 'LOAN';
}

export function isCreateLoanCheckerCommand(
  actionName?: string | null,
  entityName?: string | null
): boolean {
  return (actionName ?? '').trim().toUpperCase() === 'CREATE' && isLoanCheckerEntity(entityName);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Parse maker-checker `commandAsJson` for LOAN commands. */
export function parseLoanCommandAsJson(
  commandAsJson: string | undefined | null
): Record<string, unknown> | null {
  if (!commandAsJson?.trim()) {
    return null;
  }
  try {
    return asRecord(JSON.parse(commandAsJson) as unknown);
  } catch {
    return null;
  }
}

export function loanClientIdFromCommandAsJson(
  commandAsJson: string | undefined | null
): number | undefined {
  return asNumber(parseLoanCommandAsJson(commandAsJson)?.clientId);
}

export function loanProductIdFromCommandAsJson(
  commandAsJson: string | undefined | null
): number | undefined {
  return asNumber(parseLoanCommandAsJson(commandAsJson)?.productId);
}

/** Best-effort subject for list/sheet when the live loan account is unavailable. */
export function loanSubjectFromCommandAsJson(
  commandAsJson: string | undefined | null
): string | undefined {
  const payload = parseLoanCommandAsJson(commandAsJson);
  if (!payload) {
    return undefined;
  }

  const principal =
    asNumber(payload.principal) ??
    asNumber(payload.approvedLoanAmount) ??
    asNumber(payload.transactionAmount);
  const productId = asNumber(payload.productId);
  const note = asString(payload.note)?.trim();

  if (principal != null && productId != null) {
    return `Product #${productId} · ${principal}`;
  }
  if (principal != null) {
    return `Loan · ${principal}`;
  }
  if (note) {
    return note.length > 80 ? `${note.slice(0, 77)}…` : note;
  }
  if (productId != null) {
    return `Product #${productId}`;
  }
  return undefined;
}

function mapCharges(raw: unknown): CreateLoanAccountInput['charges'] {
  return asArray(raw)
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const chargeId = asNumber(row.chargeId);
      const amount = asNumber(row.amount);
      if (chargeId == null || amount == null) {
        return null;
      }
      return {
        id: asNumber(row.id),
        chargeId,
        amount,
        dueDate: asString(row.dueDate) ?? '',
        feeInterval: asNumber(row.feeInterval),
        feeOnMonthDay: asString(row.feeOnMonthDay) ?? ''
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
}

function mapCollateral(raw: unknown): CreateLoanAccountInput['collateral'] {
  return asArray(raw)
    .map((item) => {
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const collateralTypeId =
        asNumber(row.collateralTypeId) ?? asNumber(row.clientCollateralId);
      const value = asNumber(row.value) ?? asNumber(row.quantity);
      if (collateralTypeId == null || value == null) {
        return null;
      }
      return {
        collateralTypeId,
        value,
        description: asString(row.description) ?? ''
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
}

/**
 * Inverse of {@link buildLoanAccountPayload} for CREATE LOAN checker review.
 * Guarantors are not in the create body — they stay empty in the draft.
 */
export function loanAccountDraftFromCommandPayload(
  payload: Record<string, unknown>
): LoanAccountDraft | null {
  const productId = asNumber(payload.productId);
  const principal = asNumber(payload.principal);
  if (productId == null || principal == null) {
    return null;
  }

  const base = emptyLoanAccountDraft(asString(payload.submittedOnDate));
  return {
    ...base,
    productId,
    loanOfficerId: asNumber(payload.loanOfficerId) ?? base.loanOfficerId,
    loanPurposeId: asNumber(payload.loanPurposeId),
    fundId: asNumber(payload.fundId),
    externalId: asString(payload.externalId) ?? '',
    principal,
    loanTermFrequency: asNumber(payload.loanTermFrequency) ?? base.loanTermFrequency,
    loanTermFrequencyType: asNumber(payload.loanTermFrequencyType) ?? base.loanTermFrequencyType,
    loanType: 'individual',
    numberOfRepayments: asNumber(payload.numberOfRepayments) ?? base.numberOfRepayments,
    repaymentEvery: asNumber(payload.repaymentEvery) ?? base.repaymentEvery,
    repaymentFrequencyType:
      asNumber(payload.repaymentFrequencyType) ?? base.repaymentFrequencyType,
    interestRatePerPeriod: asNumber(payload.interestRatePerPeriod) ?? base.interestRatePerPeriod,
    interestRateDifferential: asNumber(payload.interestRateDifferential),
    isFloatingInterestRate: asBoolean(payload.isFloatingInterestRate),
    graceOnPrincipalPayment:
      asNumber(payload.graceOnPrincipalPayment) ?? base.graceOnPrincipalPayment,
    graceOnInterestPayment:
      asNumber(payload.graceOnInterestPayment) ?? base.graceOnInterestPayment,
    graceOnInterestCharged:
      asNumber(payload.graceOnInterestCharged) ?? base.graceOnInterestCharged,
    amortizationType: asNumber(payload.amortizationType) ?? base.amortizationType,
    interestType: asNumber(payload.interestType) ?? base.interestType,
    interestCalculationPeriodType:
      asNumber(payload.interestCalculationPeriodType) ?? base.interestCalculationPeriodType,
    transactionProcessingStrategyCode:
      asString(payload.transactionProcessingStrategyCode) ??
      base.transactionProcessingStrategyCode,
    submittedOnDate: asString(payload.submittedOnDate) ?? base.submittedOnDate,
    expectedDisbursementDate:
      asString(payload.expectedDisbursementDate) ?? base.expectedDisbursementDate,
    repaymentsStartingFromDate: asString(payload.repaymentsStartingFromDate) ?? '',
    linkAccountId: asNumber(payload.linkAccountId),
    createStandingInstructionAtDisbursement:
      asBoolean(payload.createStandingInstructionAtDisbursement) ??
      base.createStandingInstructionAtDisbursement,
    enableDownPayment: asBoolean(payload.enableDownPayment),
    charges: mapCharges(payload.charges),
    collateral: mapCollateral(payload.collateral),
    guarantors: []
  };
}

export function loanAccountDraftFromCommandAsJson(
  commandAsJson: string | undefined | null
): LoanAccountDraft | null {
  const payload = parseLoanCommandAsJson(commandAsJson);
  if (!payload) {
    return null;
  }
  return loanAccountDraftFromCommandPayload(payload);
}

/** Preferred highlight keys for LOAN checker tasks (create, approve, disburse). */
export const LOAN_PREFERRED_COMMAND_KEYS = [
  'principal',
  'approvedLoanAmount',
  'transactionAmount',
  'productId',
  'clientId',
  'expectedDisbursementDate',
  'approvedOnDate',
  'actualDisbursementDate',
  'submittedOnDate',
  'loanOfficerId',
  'note',
  'externalId',
  'numberOfRepayments',
  'interestRatePerPeriod'
] as const;

export function loanCommandHighlightLimit(): number {
  return 6;
}
