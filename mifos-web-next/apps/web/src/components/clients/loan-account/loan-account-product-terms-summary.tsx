'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { ReactNode } from 'react';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  MoneyValue
} from '@/components/composites';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import {
  LOAN_ACCOUNT_AMORTIZATION_HINT,
  LOAN_ACCOUNT_INTEREST_CALCULATION_PERIOD_HINT,
  LOAN_ACCOUNT_INTEREST_TYPE_HINT,
  LOAN_ACCOUNT_NUMBER_OF_REPAYMENTS_HINT,
  LOAN_ACCOUNT_PRINCIPAL_HINT,
  LOAN_ACCOUNT_REPAY_EVERY_HINT,
  LOAN_ACCOUNT_REPAYMENT_FREQUENCY_TYPE_HINT,
  LOAN_ACCOUNT_REPAYMENT_STRATEGY_HINT
} from '@/lib/fineract/loan-account-field-hints';

function TermsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">{title}</h4>
      {children}
    </div>
  );
}

function formatPercent(value?: number): string {
  return value !== undefined ? `${value}%` : '—';
}

function hasProductTermsInfo(template: ClientLoanAccountTemplate): boolean {
  return (
    template.product?.name != null ||
    template.principal != null ||
    template.minPrincipal != null ||
    template.maxPrincipal != null ||
    template.loanTermFrequency != null ||
    template.numberOfRepayments != null ||
    template.repaymentEvery != null ||
    template.interestRatePerPeriod != null ||
    template.amortizationType != null
  );
}

export function hasLoanAccountProductTermsInfo(template: ClientLoanAccountTemplate): boolean {
  return hasProductTermsInfo(template);
}

function ProductTermsSummaryContent({
  template,
  productName
}: {
  template: ClientLoanAccountTemplate;
  productName?: string;
}) {
  const currencyCode = template.currency?.code ?? 'USD';

  return (
    <div className="space-y-6">
      {productName ? (
        <p className="text-sm text-muted-foreground">
          Defaults and limits from {productName}.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Defaults and limits from the selected loan product.
        </p>
      )}

      <TermsGroup title="Principal">
          <DetailFieldGrid>
            <DetailField label="Default principal" hint={LOAN_ACCOUNT_PRINCIPAL_HINT}>
              <MoneyValue amount={template.principal} currencyCode={currencyCode} />
            </DetailField>
            <DetailField label="Min principal">
              <MoneyValue amount={template.minPrincipal} currencyCode={currencyCode} />
            </DetailField>
            <DetailField label="Max principal">
              <MoneyValue amount={template.maxPrincipal} currencyCode={currencyCode} />
            </DetailField>
          </DetailFieldGrid>
        </TermsGroup>

        <TermsGroup title="Loan term">
          <DetailFieldGrid>
            <DetailField label="Default loan term">
              {template.loanTermFrequency != null
                ? `${template.loanTermFrequency} ${enumOptionLabel(template.loanTermFrequencyType) ?? ''}`.trim()
                : '—'}
            </DetailField>
          </DetailFieldGrid>
        </TermsGroup>

        <TermsGroup title="Repayments">
          <DetailFieldGrid>
            <DetailField
              label="Number of repayments"
              hint={LOAN_ACCOUNT_NUMBER_OF_REPAYMENTS_HINT}
            >
              {template.numberOfRepayments ?? '—'}
            </DetailField>
            <DetailField label="Min repayments">
              {template.minNumberOfRepayments ?? '—'}
            </DetailField>
            <DetailField label="Max repayments">
              {template.maxNumberOfRepayments ?? '—'}
            </DetailField>
            <DetailField label="Repay every" hint={LOAN_ACCOUNT_REPAY_EVERY_HINT}>
              {template.repaymentEvery ?? '—'}
            </DetailField>
            <DetailField
              label="Repayment interval unit"
              hint={LOAN_ACCOUNT_REPAYMENT_FREQUENCY_TYPE_HINT}
            >
              {enumOptionLabel(template.repaymentFrequencyType) ?? '—'}
            </DetailField>
            <DetailField
              label="Repayment strategy"
              hint={LOAN_ACCOUNT_REPAYMENT_STRATEGY_HINT}
            >
              {template.transactionProcessingStrategyName ?? '—'}
            </DetailField>
          </DetailFieldGrid>
        </TermsGroup>

        <TermsGroup title="Interest">
          <DetailFieldGrid>
            <DetailField label="Minimum interest rate">
              {formatPercent(template.minInterestRatePerPeriod)}
            </DetailField>
            <DetailField label="Default interest rate">
              {formatPercent(template.interestRatePerPeriod)}
            </DetailField>
            <DetailField label="Maximum interest rate">
              {formatPercent(template.maxInterestRatePerPeriod)}
            </DetailField>
            <DetailField label="Interest rate frequency">
              {enumOptionLabel(template.interestRateFrequencyType) ?? '—'}
            </DetailField>
            <DetailField label="Amortization" hint={LOAN_ACCOUNT_AMORTIZATION_HINT}>
              {enumOptionLabel(template.amortizationType) ?? '—'}
            </DetailField>
            <DetailField label="Interest type" hint={LOAN_ACCOUNT_INTEREST_TYPE_HINT}>
              {enumOptionLabel(template.interestType) ?? '—'}
            </DetailField>
            <DetailField
              label="Interest calculation period"
              hint={LOAN_ACCOUNT_INTEREST_CALCULATION_PERIOD_HINT}
            >
              {enumOptionLabel(template.interestCalculationPeriodType) ?? '—'}
            </DetailField>
          </DetailFieldGrid>
        </TermsGroup>
    </div>
  );
}

export function LoanAccountProductTermsSummary({
  template,
  variant = 'card'
}: {
  template: ClientLoanAccountTemplate;
  variant?: 'card' | 'embedded';
}) {
  if (!hasProductTermsInfo(template)) {
    return null;
  }

  const productName = template.product?.name;

  const content = (
    <ProductTermsSummaryContent template={template} productName={productName} />
  );

  if (variant === 'embedded') {
    return content;
  }

  return (
    <DetailSection title="Product terms">
      {content}
    </DetailSection>
  );
}
