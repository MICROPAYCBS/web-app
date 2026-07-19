/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  AllocateCashierCashPayload,
  AssignCashierPayload,
  SettleCashierCashPayload,
  UpdateCashierPayload
} from '@mifos/validation';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

function withFineractLocale<T extends { dateFormat?: string; locale?: string }>(
  input: T
): T & { dateFormat: string; locale: string } {
  return {
    ...input,
    dateFormat: input.dateFormat ?? FINERACT_DATE_FORMAT,
    locale: input.locale ?? FINERACT_LOCALE
  };
}

export function buildAssignCashierPayload(
  input: AssignCashierPayload
): Record<string, unknown> {
  return stripEmpty({
    ...withFineractLocale(input),
    startDate: normalizeFineractDateField(input.startDate),
    endDate: normalizeFineractDateField(input.endDate)
  });
}

export function buildUpdateCashierPayload(
  input: UpdateCashierPayload
): Record<string, unknown> {
  return stripEmpty({
    ...withFineractLocale(input),
    startDate: normalizeFineractDateField(input.startDate),
    endDate: normalizeFineractDateField(input.endDate)
  });
}

export function buildCashierCashPayload(
  input: AllocateCashierCashPayload | SettleCashierCashPayload
): Record<string, unknown> {
  const payload = stripEmpty({
    ...withFineractLocale(input),
    txnDate: normalizeFineractDateField(input.txnDate),
    txnNote: input.txnNote?.trim(),
    legalTenderLines: input.legalTenderLines.map((line) => ({
      legalTenderId: line.legalTenderId,
      quantity: line.quantity
    }))
  });
  if (!payload.txnNote) {
    delete payload.txnNote;
  }
  return payload;
}
