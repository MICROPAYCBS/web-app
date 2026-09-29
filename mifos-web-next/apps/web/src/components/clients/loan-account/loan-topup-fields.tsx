'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientActiveLoanOption } from '@mifos/api-client';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { LoanTopupQuoteBreakdown } from '@/components/clients/loan-account/loan-topup-quote';
import type { LoanTopupPayoff } from '@/lib/fineract/loan-topup';

export function LoanTopupFields({
  enabled,
  loanIdToClose,
  options,
  optionLabel,
  currencyCode,
  errors,
  loading,
  payoff,
  cashToClient,
  omittedInterestBased,
  pendingWarning,
  onChange
}: {
  enabled: boolean;
  loanIdToClose?: number;
  options: ClientActiveLoanOption[];
  optionLabel: (option: ClientActiveLoanOption) => string;
  currencyCode: string;
  errors: { loanIdToClose?: string };
  loading: boolean;
  payoff?: LoanTopupPayoff | null;
  cashToClient?: number | null;
  omittedInterestBased?: boolean;
  pendingWarning?: string | null;
  onChange: (patch: { isTopup: boolean; loanIdToClose?: number }) => void;
}) {
  const selectOptions = options.map((option) => ({
    value: String(option.id),
    label: optionLabel(option)
  }));
  if (
    loanIdToClose != null &&
    loanIdToClose > 0 &&
    !selectOptions.some((option) => option.value === String(loanIdToClose))
  ) {
    selectOptions.unshift({
      value: String(loanIdToClose),
      label: `Loan ${loanIdToClose}`
    });
  }

  return (
    <DetailSection title="Top-up">
      <div className="space-y-4">
        <SwitchField
          id="loan-is-topup"
          label="Top up an existing loan"
          description="When this loan is disbursed, it repays the selected loan and pays the customer what is left."
          checked={enabled}
          onCheckedChange={(isTopup) =>
            onChange({
              isTopup,
              loanIdToClose: isTopup ? loanIdToClose : undefined
            })
          }
        />
        {enabled ? (
          <>
            <SelectField
              label="Loan to close"
              required
              loading={loading}
              value={loanIdToClose ? String(loanIdToClose) : undefined}
              onValueChange={(value) =>
                onChange({
                  isTopup: true,
                  loanIdToClose: value ? Number(value) : undefined
                })
              }
              options={selectOptions}
              placeholder="Select an active loan"
              error={errors.loanIdToClose}
              emptyMessage="This customer has no active loans in this currency."
            />
            {pendingWarning ? (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {pendingWarning}
              </p>
            ) : null}
            {payoff ? (
              <LoanTopupQuoteBreakdown
                currencyCode={currencyCode}
                payoff={payoff}
                cashToClient={cashToClient}
                estimate
                omittedInterestBased={omittedInterestBased}
              />
            ) : loading ? (
              <p className="text-sm text-muted-foreground">Calculating the payoff…</p>
            ) : null}
          </>
        ) : null}
      </div>
    </DetailSection>
  );
}
