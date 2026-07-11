'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { DetailSection } from '@/components/composites/detail/detail-section';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { GL_ACCOUNT_TYPE_ASSET } from '@/lib/accounting/gl-account-display';
import { currencySelectOptions, formatJournalEntryGlAccountLabel } from '@/lib/accounting/journal-entry-display';
import type { CentralBranchPaymentStepProps } from './types';

export function PaymentDetailsStep({
  form,
  errors,
  pending,
  onPatch,
  offices,
  currencies,
  paymentTypes,
  glAccounts
}: CentralBranchPaymentStepProps) {
  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: office.name ?? office.nameDecorated ?? String(office.id)
      })),
    [offices]
  );

  const creditAccountOptions = useMemo(
    () =>
      glAccounts
        .filter((account) => account.typeId === GL_ACCOUNT_TYPE_ASSET)
        .map((account) => ({
          value: String(account.id),
          label: formatJournalEntryGlAccountLabel(account),
          keywords: [account.glCode, account.name]
        })),
    [glAccounts]
  );

  const sourceOfficeName =
    offices.find((office) => office.id === form.fundingOfficeId)?.name ??
    offices.find((office) => office.id === form.fundingOfficeId)?.nameDecorated ??
    'the source office';

  const paymentTypeOptions = useMemo(
    () =>
      paymentTypes.map((paymentType) => ({
        value: String(paymentType.id),
        label: paymentType.name
      })),
    [paymentTypes]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Credits consolidate at{' '}
        <span className="font-medium text-foreground">{sourceOfficeName}</span>. Branch debits post
        at each consuming office, cleared through inter-branch reconciliation on every leg.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <TransactionDateField
          label="Date"
          value={form.transactionDate}
          onChange={(value) => onPatch({ transactionDate: value })}
          disabled={pending}
          error={errors.transactionDate}
        />
        <SelectField
          label="Currency"
          required
          value={form.currencyCode || undefined}
          onValueChange={(value) => onPatch({ currencyCode: value ?? '' })}
          options={currencySelectOptions(currencies)}
          disabled={pending}
          error={errors.currencyCode}
        />
        <SelectField
          label="Source office"
          required
          value={form.fundingOfficeId > 0 ? String(form.fundingOfficeId) : undefined}
          onValueChange={(value) => onPatch({ fundingOfficeId: value ? Number(value) : 0 })}
          options={officeOptions}
          placeholder="Select office"
          disabled={pending}
          error={errors.fundingOfficeId}
          hint="Office for the consolidated credit entry."
        />
        <SelectField
          label="Credit account"
          required
          value={form.bankGlAccountId > 0 ? String(form.bankGlAccountId) : undefined}
          onValueChange={(value) => onPatch({ bankGlAccountId: value ? Number(value) : 0 })}
          options={creditAccountOptions}
          placeholder="Select account"
          disabled={pending}
          error={errors.bankGlAccountId}
          hint="Credited at the source office."
        />
        <TextField
          label="Reference"
          required
          value={form.referenceNumber}
          onChange={(value) => onPatch({ referenceNumber: value })}
          disabled={pending}
          error={errors.referenceNumber}
        />
        <TextField
          label="Comments"
          optional
          value={form.comments ?? ''}
          onChange={(value) => onPatch({ comments: value })}
          disabled={pending}
        />
      </div>

      <DetailSection title="Optional details" description="Attached to the source office entry only.">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Payment type"
            optional
            value={form.paymentTypeId ? String(form.paymentTypeId) : undefined}
            onValueChange={(value) =>
              onPatch({ paymentTypeId: value ? Number(value) : undefined })
            }
            options={paymentTypeOptions}
            placeholder="Select type"
            disabled={pending}
            error={errors.paymentTypeId}
          />
          <TextField
            label="Account number"
            optional
            value={form.accountNumber ?? ''}
            onChange={(value) => onPatch({ accountNumber: value })}
            disabled={pending}
          />
          <TextField
            label="Cheque number"
            optional
            value={form.checkNumber ?? ''}
            onChange={(value) => onPatch({ checkNumber: value })}
            disabled={pending}
          />
          <TextField
            label="Routing code"
            optional
            value={form.routingCode ?? ''}
            onChange={(value) => onPatch({ routingCode: value })}
            disabled={pending}
          />
          <TextField
            label="Receipt number"
            optional
            value={form.receiptNumber ?? ''}
            onChange={(value) => onPatch({ receiptNumber: value })}
            disabled={pending}
          />
          <TextField
            label="Bank number"
            optional
            value={form.bankNumber ?? ''}
            onChange={(value) => onPatch({ bankNumber: value })}
            disabled={pending}
          />
        </div>
      </DetailSection>
    </div>
  );
}
