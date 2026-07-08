'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { workflowCurrencySelectOptions } from '@/lib/fineract/approval-workflow-display';
import type { WorkflowStepProps } from '../types';

export function CriteriaStep({ draft, currencies, errors, disabled, onChange }: WorkflowStepProps) {
  const currencyOptions = useMemo(
    () => workflowCurrencySelectOptions(currencies),
    [currencies]
  );
  const currencyCode = draft.currencyCode?.trim() || undefined;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Amount bands let several workflows coexist for the same task. Leave amounts empty for the
        default catch-all workflow.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          id="workflow-currencyCode"
          label="Currency"
          optional
          value={draft.currencyCode ?? ''}
          onValueChange={(value) => onChange({ currencyCode: value || null })}
          options={currencyOptions}
          placeholder="Optional"
          disabled={disabled}
          error={errors.currencyCode}
        />
        <MoneyField
          id="workflow-minAmount"
          label="Minimum amount"
          optional
          currencyCode={currencyCode}
          value={draft.minAmount == null ? '' : String(draft.minAmount)}
          onChange={(value) => onChange({ minAmount: value === '' ? null : Number(value) })}
          disabled={disabled}
          error={errors.minAmount}
        />
        <MoneyField
          id="workflow-maxAmount"
          label="Maximum amount"
          optional
          currencyCode={currencyCode}
          value={draft.maxAmount == null ? '' : String(draft.maxAmount)}
          onChange={(value) => onChange({ maxAmount: value === '' ? null : Number(value) })}
          disabled={disabled}
          error={errors.maxAmount}
        />
      </div>
    </div>
  );
}
