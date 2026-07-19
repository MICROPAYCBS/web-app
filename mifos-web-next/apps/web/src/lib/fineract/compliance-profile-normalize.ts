/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientComplianceProfile,
  FineractClientOtherBankAccount
} from '@mifos/api-client';

function readString(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return undefined;
}

function readBoolean(row: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value === true || value === 'Y' || value === 'y') {
      return true;
    }
    if (value === false || value === 'N' || value === 'n') {
      return false;
    }
  }
  return undefined;
}

function readNumber(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

export function normalizeOtherBankAccount(
  raw: unknown
): FineractClientOtherBankAccount | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const bankName = readString(row, 'bankName', 'bankname') ?? '';
  const accountNumber = readString(row, 'accountNumber', 'accountnumber') ?? '';
  if (!bankName && !accountNumber) {
    return null;
  }

  return {
    id: readNumber(row, 'id'),
    clientId: readNumber(row, 'clientId', 'clientid'),
    bankName,
    branchName: readString(row, 'branchName', 'branchname'),
    accountNumber,
    displayOrder: readNumber(row, 'displayOrder', 'displayorder')
  };
}

/** Coerce Fineract/other payloads into a stable bank-account array for UI and validation. */
export function normalizeOtherBankAccounts(raw: unknown): FineractClientOtherBankAccount[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeOtherBankAccount(item))
      .filter((account): account is FineractClientOtherBankAccount => account !== null);
  }
  const single = normalizeOtherBankAccount(raw);
  return single ? [single] : [];
}

export function normalizeClientComplianceProfile(
  raw: unknown
): FineractClientComplianceProfile | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const otherBankAccounts = normalizeOtherBankAccounts(
    row.otherBankAccounts ?? row.otherbankaccounts
  );

  return {
    id: readNumber(row, 'id'),
    clientId: readNumber(row, 'clientId', 'clientid'),
    hasOtherBankAccounts: readBoolean(row, 'hasOtherBankAccounts', 'hasotherbankaccounts'),
    isPep: readBoolean(row, 'isPep', 'ispep'),
    pepPosition: readString(row, 'pepPosition', 'pepposition'),
    pepRelativeName: readString(row, 'pepRelativeName', 'peprelativename'),
    usCitizenOrResident: readBoolean(row, 'usCitizenOrResident', 'uscitizenorresident'),
    fatcaRegistered: readBoolean(row, 'fatcaRegistered', 'fatcaregistered'),
    fatcaRegistrationNo: readString(row, 'fatcaRegistrationNo', 'fatcaregistrationno'),
    dpfAlternativeBankName: readString(row, 'dpfAlternativeBankName', 'dpfalternativebankname'),
    dpfAlternativeAccountNumber: readString(
      row,
      'dpfAlternativeAccountNumber',
      'dpfalternativeaccountnumber'
    ),
    otherBankAccounts
  };
}
