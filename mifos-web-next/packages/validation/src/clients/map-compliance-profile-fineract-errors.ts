/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FieldError } from '../map-fineract-errors';

const BANK_FIELD_NAMES = new Set(['bankName', 'branchName', 'accountNumber', 'displayOrder']);

function parseIndexedParameterName(parameterName: string): { index: number; field: string } | null {
  const match = /^(\w+)\[(\d+)\](?:\[(\w+)\])?$/.exec(parameterName);
  if (!match) {
    return null;
  }

  const field = match[3] ?? match[1];
  const index = Number(match[2]);
  if (!Number.isFinite(index) || !BANK_FIELD_NAMES.has(field)) {
    return null;
  }

  return { index, field };
}

/**
 * Map Fineract compliance-profile validation errors to compliance form field keys.
 * Fineract often returns bare `bankName` / `accountNumber` without array indexes.
 */
export function mapComplianceProfileFineractFieldErrors(
  fieldErrors: FieldError[]
): Record<string, string> {
  const mapped: Record<string, string> = {};
  const bankFieldCounts: Record<string, number> = {};

  for (const error of fieldErrors) {
    const parameterName = error.field === '_form' ? undefined : error.field.trim();
    if (!parameterName) {
      if (!mapped._form) {
        mapped._form = error.message;
      }
      continue;
    }

    if (parameterName === 'otherBankAccounts') {
      mapped.otherBankAccounts = error.message;
      continue;
    }

    const indexed = parseIndexedParameterName(parameterName);
    if (indexed) {
      mapped[`otherBankAccounts.${indexed.index}.${indexed.field}`] = error.message;
      continue;
    }

    if (BANK_FIELD_NAMES.has(parameterName)) {
      const occurrence = bankFieldCounts[parameterName] ?? 0;
      bankFieldCounts[parameterName] = occurrence + 1;
      mapped[`otherBankAccounts.${occurrence}.${parameterName}`] = error.message;
      continue;
    }

    mapped[parameterName] = error.message;
  }

  return mapped;
}
