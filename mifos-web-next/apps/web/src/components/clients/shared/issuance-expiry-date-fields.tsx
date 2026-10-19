'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DateField } from '@/components/composites/date-field';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import { ISO_CALENDAR_DATE_FORMAT } from '@/lib/fineract/dates';

export function IssuanceExpiryDateFields({
  formId,
  issuanceDate,
  expiryDate,
  onIssuanceChange,
  onExpiryChange,
  fieldErrors = {},
  disabled = false
}: {
  formId: string;
  issuanceDate?: string;
  expiryDate?: string;
  onIssuanceChange: (value: string | undefined) => void;
  onExpiryChange: (value: string | undefined) => void;
  fieldErrors?: Record<string, string>;
  disabled?: boolean;
}) {
  const issuance = fineractDateToDate(issuanceDate, ISO_CALENDAR_DATE_FORMAT);
  const expiry = fineractDateToDate(expiryDate, ISO_CALENDAR_DATE_FORMAT);

  return (
    <>
      <DateField
        id={`${formId}-issuanceDate`}
        label="Issued on"
        optional
        value={issuanceDate}
        onChange={onIssuanceChange}
        dateFormat={ISO_CALENDAR_DATE_FORMAT}
        toDate={expiry}
        error={fieldErrors.issuanceDate}
        disabled={disabled}
        clearable
      />
      <DateField
        id={`${formId}-expiryDate`}
        label="Expires on"
        optional
        allowFuture
        value={expiryDate}
        onChange={onExpiryChange}
        dateFormat={ISO_CALENDAR_DATE_FORMAT}
        fromDate={issuance}
        error={fieldErrors.expiryDate}
        disabled={disabled}
        clearable
      />
    </>
  );
}
