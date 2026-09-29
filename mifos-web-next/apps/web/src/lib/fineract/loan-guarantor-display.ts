/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  GUARANTOR_TYPE_CUSTOMER,
  GUARANTOR_TYPE_EXTERNAL,
  GUARANTOR_TYPE_GROUP,
  GUARANTOR_TYPE_STAFF
} from '@mifos/validation';
import { LOAN_ACCOUNT_STATUS } from '@/lib/fineract/account-field-officer-config';
import type {
  LoanGuarantorFundingRecord,
  LoanGuarantorRecord
} from '@/lib/fineract/loan-account-types';

export const GUARANTOR_FUND_ACTIVE = 100;
export const GUARANTOR_FUND_COMPLETED = 200;
export const GUARANTOR_FUND_WITHDRAWN = 300;
export const GUARANTOR_FUND_DELETED = 400;

export type LoanGuaranteeThresholds = {
  holdGuaranteeFunds: boolean;
  mandatoryGuarantee?: number;
  minimumGuaranteeFromOwnFunds?: number;
  minimumGuaranteeFromGuarantor?: number;
};

export function loanAllowsGuarantorChanges(status: {
  code?: string;
  value?: string;
  active?: boolean;
}): boolean {
  const code = status.code ?? '';
  const value = status.value ?? '';
  return (
    code === LOAN_ACCOUNT_STATUS.pending ||
    code === LOAN_ACCOUNT_STATUS.approved ||
    code === LOAN_ACCOUNT_STATUS.active ||
    status.active === true ||
    value === 'Submitted and pending approval' ||
    value === 'Approved' ||
    value === 'Active'
  );
}

export function loanGuarantorTypeNeedsEntity(typeId: number): boolean {
  return (
    typeId === GUARANTOR_TYPE_CUSTOMER ||
    typeId === GUARANTOR_TYPE_STAFF ||
    typeId === GUARANTOR_TYPE_GROUP
  );
}

export function loanGuarantorDisplayName(record: {
  guarantorTypeId?: number;
  firstname?: string;
  lastname?: string;
  groupName?: string;
  displayName?: string;
}): string {
  if (record.guarantorTypeId === GUARANTOR_TYPE_GROUP) {
    return record.groupName?.trim() || 'Group';
  }
  const fromParts = [record.firstname, record.lastname].filter(Boolean).join(' ').trim();
  return fromParts || record.displayName?.trim() || 'Guarantor';
}

export function loanGuarantorFundingCanRemove(line: { statusId?: number }): boolean {
  return line.statusId === GUARANTOR_FUND_ACTIVE;
}

export function loanGuarantorFundingStatusLabel(statusId?: number): string {
  switch (statusId) {
    case GUARANTOR_FUND_ACTIVE:
      return 'Active hold';
    case GUARANTOR_FUND_COMPLETED:
      return 'Released';
    case GUARANTOR_FUND_WITHDRAWN:
      return 'Withdrawn';
    case GUARANTOR_FUND_DELETED:
      return 'Deleted';
    default:
      return 'Pledge';
  }
}

export function loanGuarantorCanRemovePerson(record: {
  active: boolean;
  funding: LoanGuarantorFundingRecord[];
}): boolean {
  return record.active && record.funding.length === 0;
}

/** Borrower pledging their own savings must not also have a relationship. */
export function loanGuarantorOwnSavingsIssue(input: {
  guarantorTypeId: number;
  entityId?: number;
  borrowerClientId?: number;
  savingsId?: number;
  clientRelationshipTypeId?: number;
  holdGuaranteeFunds: boolean;
}): string | null {
  if (
    !input.holdGuaranteeFunds ||
    input.guarantorTypeId !== GUARANTOR_TYPE_CUSTOMER ||
    input.borrowerClientId == null ||
    input.entityId == null ||
    input.entityId !== input.borrowerClientId
  ) {
    return null;
  }
  if (input.savingsId == null) {
    return 'The borrower can guarantee this loan only by pledging their own savings.';
  }
  if (input.clientRelationshipTypeId != null) {
    return 'Leave relationship empty when the borrower pledges their own savings.';
  }
  return null;
}

function activePledgeAmount(line: LoanGuarantorFundingRecord): number {
  if (line.statusId != null && line.statusId !== GUARANTOR_FUND_ACTIVE) {
    return 0;
  }
  return line.amount ?? 0;
}

export function loanGuaranteePledgeTotals(
  guarantors: LoanGuarantorRecord[],
  borrowerClientId?: number
): { ownFunds: number; other: number } {
  let ownFunds = 0;
  let other = 0;
  for (const guarantor of guarantors) {
    if (!guarantor.active) {
      continue;
    }
    const pledged = guarantor.funding.reduce((sum, line) => sum + activePledgeAmount(line), 0);
    if (pledged <= 0) {
      continue;
    }
    const isOwn =
      guarantor.guarantorTypeId === GUARANTOR_TYPE_CUSTOMER &&
      borrowerClientId != null &&
      guarantor.entityId === borrowerClientId;
    if (isOwn) {
      ownFunds += pledged;
    } else {
      other += pledged;
    }
  }
  return { ownFunds, other };
}

export type LoanGuaranteeShortfall = {
  ownFundsRequired: number;
  otherRequired: number;
  mandatoryRequired: number;
  ownFundsPledged: number;
  otherPledged: number;
  ownFundsShort: number;
  otherShort: number;
  mandatoryShort: number;
};

function percentOf(principal: number, percent: number | undefined): number {
  if (percent == null || !Number.isFinite(percent)) {
    return 0;
  }
  return (principal * percent) / 100;
}

export function loanGuaranteeShortfall(input: {
  principal?: number;
  thresholds?: LoanGuaranteeThresholds | null;
  guarantors: LoanGuarantorRecord[];
  borrowerClientId?: number;
  pending?: { ownFunds?: number; other?: number };
}): LoanGuaranteeShortfall | null {
  const thresholds = input.thresholds;
  if (!thresholds?.holdGuaranteeFunds || input.principal == null || input.principal <= 0) {
    return null;
  }
  const pledged = loanGuaranteePledgeTotals(input.guarantors, input.borrowerClientId);
  const ownFundsPledged = pledged.ownFunds + (input.pending?.ownFunds ?? 0);
  const otherPledged = pledged.other + (input.pending?.other ?? 0);
  const ownFundsRequired = percentOf(input.principal, thresholds.minimumGuaranteeFromOwnFunds);
  const otherRequired = percentOf(input.principal, thresholds.minimumGuaranteeFromGuarantor);
  const mandatoryRequired = percentOf(input.principal, thresholds.mandatoryGuarantee);
  return {
    ownFundsRequired,
    otherRequired,
    mandatoryRequired,
    ownFundsPledged,
    otherPledged,
    ownFundsShort: Math.max(0, ownFundsRequired - ownFundsPledged),
    otherShort: Math.max(0, otherRequired - otherPledged),
    mandatoryShort: Math.max(0, mandatoryRequired - (ownFundsPledged + otherPledged))
  };
}

export function loanHasRecoverableGuarantee(guarantors: LoanGuarantorRecord[]): boolean {
  return guarantors.some((guarantor) =>
    guarantor.funding.some(
      (line) =>
        line.statusId === GUARANTOR_FUND_ACTIVE && (line.amountRemaining ?? line.amount ?? 0) > 0
    )
  );
}

export function loanGuarantorTypeLabel(typeId: number): string {
  switch (typeId) {
    case GUARANTOR_TYPE_CUSTOMER:
      return 'CUSTOMER';
    case GUARANTOR_TYPE_STAFF:
      return 'STAFF';
    case GUARANTOR_TYPE_EXTERNAL:
      return 'EXTERNAL';
    case GUARANTOR_TYPE_GROUP:
      return 'GROUP';
    default:
      return 'Guarantor';
  }
}
