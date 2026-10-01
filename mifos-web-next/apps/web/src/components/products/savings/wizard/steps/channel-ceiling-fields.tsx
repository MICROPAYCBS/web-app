'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductPaymentChannelsInput } from '@mifos/validation';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type ChannelRow = SavingsProductPaymentChannelsInput['channels'][number];
type CeilingKey = keyof Pick<
  ChannelRow,
  | 'maxDebitPerTxn'
  | 'maxDebitPerDay'
  | 'maxDebitPerMonth'
  | 'maxDebitCountPerDay'
  | 'maxDebitCountPerMonth'
  | 'maxCreditPerTxn'
  | 'maxCreditPerDay'
  | 'maxCreditPerMonth'
  | 'maxCreditCountPerDay'
  | 'maxCreditCountPerMonth'
>;

const DEBIT_FIELDS: { key: CeilingKey; label: string; count?: boolean }[] = [
  { key: 'maxDebitPerTxn', label: 'Per transaction' },
  { key: 'maxDebitPerDay', label: 'Per day' },
  { key: 'maxDebitPerMonth', label: 'Per month' },
  { key: 'maxDebitCountPerDay', label: 'Count per day', count: true },
  { key: 'maxDebitCountPerMonth', label: 'Count per month', count: true }
];

const CREDIT_FIELDS: { key: CeilingKey; label: string; count?: boolean }[] = [
  { key: 'maxCreditPerTxn', label: 'Per transaction' },
  { key: 'maxCreditPerDay', label: 'Per day' },
  { key: 'maxCreditPerMonth', label: 'Per month' },
  { key: 'maxCreditCountPerDay', label: 'Count per day', count: true },
  { key: 'maxCreditCountPerMonth', label: 'Count per month', count: true }
];

function amountText(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

function parseAmount(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function CeilingGroup({
  title,
  description,
  fields,
  row,
  currencyCode,
  idPrefix,
  fieldError,
  onChange
}: {
  title: string;
  description: string;
  fields: { key: CeilingKey; label: string; count?: boolean }[];
  row: ChannelRow;
  currencyCode?: string;
  idPrefix: string;
  fieldError: (field: string) => string | undefined;
  onChange: (patch: Partial<ChannelRow>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) =>
          field.count ? (
            <NumericField
              key={field.key}
              id={`${idPrefix}-${field.key}`}
              label={field.label}
              integer
              optional
              value={amountText(row[field.key])}
              onChange={(value) => onChange({ [field.key]: parseAmount(value) })}
              error={fieldError(field.key)}
              placeholder="No limit"
            />
          ) : (
            <MoneyField
              key={field.key}
              id={`${idPrefix}-${field.key}`}
              label={field.label}
              optional
              currencyCode={currencyCode}
              value={amountText(row[field.key])}
              onChange={(value) => onChange({ [field.key]: parseAmount(value) })}
              error={fieldError(field.key)}
              placeholder="No limit"
            />
          )
        )}
      </div>
    </div>
  );
}

export function ChannelCeilingFields({
  row,
  currencyCode,
  idPrefix,
  fieldError,
  onChange
}: {
  row: ChannelRow;
  currencyCode?: string;
  idPrefix: string;
  fieldError: (field: string) => string | undefined;
  onChange: (patch: Partial<ChannelRow>) => void;
}) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        Bank ceilings for this channel. Leave a field blank for no ceiling. Zero blocks that
        dimension. A customer limit cannot go above a ceiling.
      </p>
      <CeilingGroup
        title="Debit"
        description="Withdrawals and transfers out."
        fields={DEBIT_FIELDS}
        row={row}
        currencyCode={currencyCode}
        idPrefix={idPrefix}
        fieldError={fieldError}
        onChange={onChange}
      />
      <CeilingGroup
        title="Credit"
        description="Deposits and transfers in."
        fields={CREDIT_FIELDS}
        row={row}
        currencyCode={currencyCode}
        idPrefix={idPrefix}
        fieldError={fieldError}
        onChange={onChange}
      />
      <div className="flex items-start gap-2">
        <Switch
          id={`${idPrefix}-transfer`}
          className="mt-0.5"
          checked={row.isAccountTransferChannel === true}
          onCheckedChange={(checked) => onChange({ isAccountTransferChannel: checked })}
        />
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-transfer`}>Account-transfer channel</Label>
          <p className="text-xs text-muted-foreground">
            Savings-to-savings transfers and savings-funded loan repayments consume this
            channel&apos;s debit limit on the source account and its credit limit on the
            destination account. Transfers stay unlimited when no active channel is marked. Only
            one active channel can be marked.
          </p>
        </div>
      </div>
    </div>
  );
}
