'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TextField } from '@/components/composites/text-field';

export type PaymentDetailFieldValues = {
  accountNumber: string;
  checkNumber: string;
  routingCode: string;
  receiptNumber: string;
  bankNumber: string;
};

export const emptyPaymentDetailFields = (): PaymentDetailFieldValues => ({
  accountNumber: '',
  checkNumber: '',
  routingCode: '',
  receiptNumber: '',
  bankNumber: ''
});

/** Optional Fineract payment detail fields shared by savings transactions and accounting forms. */
export function PaymentDetailFields({
  idPrefix,
  values,
  onChange,
  fieldErrors = {},
  disabled = false
}: {
  idPrefix: string;
  values: PaymentDetailFieldValues;
  onChange: (patch: Partial<PaymentDetailFieldValues>) => void;
  fieldErrors?: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        id={`${idPrefix}-account-number`}
        label="Account number"
        optional
        value={values.accountNumber}
        onChange={(accountNumber) => onChange({ accountNumber })}
        error={fieldErrors.accountNumber}
        disabled={disabled}
      />
      <TextField
        id={`${idPrefix}-check-number`}
        label="Cheque number"
        optional
        value={values.checkNumber}
        onChange={(checkNumber) => onChange({ checkNumber })}
        error={fieldErrors.checkNumber}
        disabled={disabled}
      />
      <TextField
        id={`${idPrefix}-routing-code`}
        label="Routing code"
        optional
        value={values.routingCode}
        onChange={(routingCode) => onChange({ routingCode })}
        error={fieldErrors.routingCode}
        disabled={disabled}
      />
      <TextField
        id={`${idPrefix}-receipt-number`}
        label="Receipt number"
        optional
        value={values.receiptNumber}
        onChange={(receiptNumber) => onChange({ receiptNumber })}
        error={fieldErrors.receiptNumber}
        disabled={disabled}
      />
      <TextField
        id={`${idPrefix}-bank-number`}
        label="Bank number"
        optional
        value={values.bankNumber}
        onChange={(bankNumber) => onChange({ bankNumber })}
        error={fieldErrors.bankNumber}
        disabled={disabled}
        className="sm:col-span-2"
      />
    </div>
  );
}
