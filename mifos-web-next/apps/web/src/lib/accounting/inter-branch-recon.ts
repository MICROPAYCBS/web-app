/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFinancialActivityMappingListItem } from '@mifos/api-client';

/** Fallback when interBranchRecon financial activity mapping is absent. */
export const DEFAULT_CLEARING_GL_CODE = 'MP-20010';

/** Fineract financial activity for inter-branch clearing (Micropay: maps to MP-20010). */
export const INTER_BRANCH_RECON_FINANCIAL_ACTIVITY_NAME = 'interBranchRecon';

export const INTER_BRANCH_RECON_FINANCIAL_ACTIVITY_ID = 203;

export const CENTRAL_BRANCH_CLEARING_NOT_CONFIGURED_MESSAGE =
  'Inter-branch reconciliation is not configured. Define the interBranchRecon financial activity mapping under Accounting → Financial activity mappings (typically MP-20010) before posting.';

export type InterBranchClearingResolution = {
  clearingGlAccountId: number | null;
  usedFinancialActivityMapping: boolean;
  warning?: string;
};

/** @deprecated Use {@link InterBranchClearingResolution}. */
export type CentralBranchClearingResolution = InterBranchClearingResolution;

export function findDefaultClearingGlAccountId(
  glAccounts: { id: number; glCode: string }[],
  preferredCode = DEFAULT_CLEARING_GL_CODE
): number | null {
  const match = glAccounts.find(
    (account) => account.glCode.trim().toUpperCase() === preferredCode.toUpperCase()
  );
  return match?.id ?? null;
}

export function findInterBranchReconGlAccountId(
  mappings: FineractFinancialActivityMappingListItem[]
): number | null {
  const mapping = mappings.find(
    (row) => row.financialActivityData.name === INTER_BRANCH_RECON_FINANCIAL_ACTIVITY_NAME
  );
  const id = mapping?.glAccountData.id;
  return id != null && Number.isFinite(id) && id > 0 ? id : null;
}

export function findInterBranchReconMapping(
  mappings: FineractFinancialActivityMappingListItem[]
): FineractFinancialActivityMappingListItem | null {
  return (
    mappings.find(
      (row) => row.financialActivityData.name === INTER_BRANCH_RECON_FINANCIAL_ACTIVITY_NAME
    ) ?? null
  );
}

/** Resolve institution-wide inter-branch clearing GL from financial activity mapping, then MP-20010. */
export function resolveCentralBranchClearingGlAccount(
  mappings: FineractFinancialActivityMappingListItem[],
  glAccounts: { id: number; glCode: string }[]
): InterBranchClearingResolution {
  const mappedId = findInterBranchReconGlAccountId(mappings);
  const fallbackId = findDefaultClearingGlAccountId(glAccounts, DEFAULT_CLEARING_GL_CODE);
  const clearingGlAccountId = mappedId ?? fallbackId;
  const usedFinancialActivityMapping = mappedId != null;

  if (clearingGlAccountId == null) {
    return {
      clearingGlAccountId: null,
      usedFinancialActivityMapping: false,
      warning: CENTRAL_BRANCH_CLEARING_NOT_CONFIGURED_MESSAGE
    };
  }

  if (!usedFinancialActivityMapping) {
    return {
      clearingGlAccountId,
      usedFinancialActivityMapping: false,
      warning: `Inter-branch reconciliation financial activity mapping was not found. Using GL account ${DEFAULT_CLEARING_GL_CODE} for clearing legs.`
    };
  }

  return {
    clearingGlAccountId,
    usedFinancialActivityMapping: true
  };
}
