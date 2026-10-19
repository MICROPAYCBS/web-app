/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientIdentifierInput } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from './dates';

function formatIdentifierDate(iso: string | undefined): string | undefined {
  if (!iso) {
    return undefined;
  }
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  return toFineractDate(new Date(year, month - 1, day));
}

/**
 * POST/PUT body for `/clients/{id}/identifiers`.
 *
 * Create omits empty dates. Update always sends both date keys so a cleared
 * date reaches the server as `null` (omitted keys are not updated; the global
 * mapper would otherwise drop nulls and fail with no-parameters-for-update).
 */
export function toFineractClientIdentifierBody(
  input: ClientIdentifierInput,
  mode: 'create' | 'update',
  dateContext: { dateFormat?: string; locale?: string } = {}
): Record<string, unknown> {
  const dateFormat = dateContext.dateFormat?.trim() || FINERACT_DATE_FORMAT;
  const locale = dateContext.locale?.trim() || FINERACT_LOCALE;
  const issuance = formatIdentifierDate(input.issuanceDate);
  const expiry = formatIdentifierDate(input.expiryDate);
  const body: Record<string, unknown> = {
    documentTypeId: input.documentTypeId,
    documentKey: input.documentKey,
    status: input.status
  };
  if (input.description?.trim()) {
    body.description = input.description.trim();
  }

  if (mode === 'update') {
    body.issuanceDate = issuance ?? null;
    body.expiryDate = expiry ?? null;
    if (issuance || expiry) {
      body.dateFormat = dateFormat;
      body.locale = locale;
    }
    return body;
  }

  if (issuance || expiry) {
    body.dateFormat = dateFormat;
    body.locale = locale;
    if (issuance) {
      body.issuanceDate = issuance;
    }
    if (expiry) {
      body.expiryDate = expiry;
    }
  }
  return body;
}
