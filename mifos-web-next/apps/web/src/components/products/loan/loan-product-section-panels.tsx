'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductDetail, LoanProductKind, LoanProductSectionId } from '@mifos/api-client';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  DateValue,
  MoneyValue
} from '@/components/composites';
import { ProductChargesTable } from '@/components/products/shared/product-charges-table';
import { ProductMappingTable } from '@/components/products/shared/product-mapping-table';
import { Badge } from '@/components/ui/badge';
import { enumOptionLabel, formatYesNo } from '@/lib/fineract/client-detail-labels';
import { loanProductKindLabel } from '@/lib/fineract/loan-product-paths';
import {
  loanProductCurrencyCode,
  loanProductFeeCharges,
  loanProductPenaltyCharges
} from '@/lib/fineract/loan-product-sections';
import { loanProductAttributeOverrideFields } from '@/lib/fineract/loan-product-attribute-overrides';
import {
  accountingRuleLabel,
  glAccountLabel
} from '@/lib/fineract/product-display';
import {
  productStatusLabel,
  productStatusVariant
} from '@/lib/fineract/product-status-display';

const LOAN_ACCOUNTING_FIELDS: { key: string; label: string; group: string }[] = [
  { key: 'fundSourceAccount', label: 'Fund source', group: 'Assets' },
  { key: 'loanPortfolioAccount', label: 'Loan portfolio', group: 'Assets' },
  { key: 'receivableInterestAccount', label: 'Interest receivable', group: 'Assets' },
  { key: 'receivableFeeAccount', label: 'Fees receivable', group: 'Assets' },
  { key: 'receivablePenaltyAccount', label: 'Penalties receivable', group: 'Assets' },
  { key: 'transfersInSuspenseAccount', label: 'Transfer in suspense', group: 'Assets' },
  { key: 'interestOnLoanAccount', label: 'Income from interest', group: 'Income' },
  { key: 'incomeFromFeeAccount', label: 'Income from fees', group: 'Income' },
  { key: 'incomeFromPenaltyAccount', label: 'Income from penalties', group: 'Income' },
  { key: 'incomeFromRecoveryAccount', label: 'Income from recovery', group: 'Income' },
  { key: 'writeOffAccount', label: 'Losses written off', group: 'Expenses' },
  { key: 'overpaymentLiabilityAccount', label: 'Overpayment liability', group: 'Liabilities' }
];

function LoanProductGeneralSection({ product, productKind }: SectionProps) {
  const currency = loanProductCurrencyCode(product);

  return (
    <>
      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Product type">{loanProductKindLabel(productKind)}</DetailField>
          <DetailField label="Short name">{product.shortName ?? '—'}</DetailField>
          <DetailField label="Status">
            <Badge variant={productStatusVariant(product.status)}>
              {productStatusLabel(product.status)}
            </Badge>
          </DetailField>
          <DetailField label="Fund">{product.fundName ?? '—'}</DetailField>
          <DetailField label="External ID">{product.externalId ?? '—'}</DetailField>
          <DetailField label="Start date">
            <DateValue value={product.startDate} />
          </DetailField>
          <DetailField label="Expiry date">
            <DateValue value={product.closeDate} />
          </DetailField>
          {productKind === 'loan' ? (
            <DetailField label="Include in customer loan counter">
              {formatYesNo(product.includeInBorrowerCycle)}
            </DetailField>
          ) : null}
          {product.description ? (
            <DetailField label="Description" className="sm:col-span-2">
              {product.description}
            </DetailField>
          ) : null}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Currency">
        <DetailFieldGrid>
          <DetailField label="Currency">
            {product.currency?.name ?? product.currency?.code ?? '—'}
          </DetailField>
          <DetailField label="Currency code">{currency}</DetailField>
          <DetailField label="Decimal places">
            {product.digitsAfterDecimal ?? product.currency?.decimalPlaces ?? '—'}
          </DetailField>
          <DetailField label="Currency in multiples of">
            {product.inMultiplesOf ?? '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </>
  );
}

function LoanProductTermsSection({ product }: { product: LoanProductDetail }) {
  const currency = loanProductCurrencyCode(product);

  return (
    <>
      <DetailSection title="Principal">
        <DetailFieldGrid>
          <DetailField label="Min principal">
            <MoneyValue amount={product.minPrincipal} currencyCode={currency} />
          </DetailField>
          <DetailField label="Default principal">
            <MoneyValue amount={product.principal} currencyCode={currency} />
          </DetailField>
          <DetailField label="Max principal">
            <MoneyValue amount={product.maxPrincipal} currencyCode={currency} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Repayments">
        <DetailFieldGrid>
          <DetailField label="Min repayments">
            {product.minNumberOfRepayments ?? '—'}
          </DetailField>
          <DetailField label="Number of repayments">
            {product.numberOfRepayments ?? '—'}
          </DetailField>
          <DetailField label="Max repayments">
            {product.maxNumberOfRepayments ?? '—'}
          </DetailField>
          <DetailField label="Repay every">{product.repaymentEvery ?? '—'}</DetailField>
          <DetailField label="Repayment frequency">
            {enumOptionLabel(product.repaymentFrequencyType) ?? '—'}
          </DetailField>
          <DetailField label="Repayment strategy">
            {product.transactionProcessingStrategyName ?? '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Interest">
        <DetailFieldGrid>
          <DetailField label="Minimum interest rate">
            {product.minInterestRatePerPeriod !== undefined
              ? `${product.minInterestRatePerPeriod}%`
              : '—'}
          </DetailField>
          <DetailField label="Default interest rate">
            {product.interestRatePerPeriod !== undefined
              ? `${product.interestRatePerPeriod}%`
              : '—'}
          </DetailField>
          <DetailField label="Maximum interest rate">
            {product.maxInterestRatePerPeriod !== undefined
              ? `${product.maxInterestRatePerPeriod}%`
              : '—'}
          </DetailField>
          <DetailField label="Interest rate frequency">
            {enumOptionLabel(product.interestRateFrequencyType) ?? '—'}
          </DetailField>
          <DetailField label="Annual interest rate">
            {product.annualInterestRate !== undefined ? `${product.annualInterestRate}%` : '—'}
          </DetailField>
          <DetailField label="Amortization">
            {enumOptionLabel(product.amortizationType) ?? '—'}
          </DetailField>
          <DetailField label="Interest type">
            {enumOptionLabel(product.interestType) ?? '—'}
          </DetailField>
          <DetailField label="Interest calculation">
            {enumOptionLabel(product.interestCalculationPeriodType) ?? '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </>
  );
}

function LoanProductSettingsSection({ product, productKind }: SectionProps) {
  return (
    <>
      <DetailSection title="Settings">
        <DetailFieldGrid>
          {productKind === 'loan' ? (
            <>
              <DetailField label="Equal amortization">
                {formatYesNo(product.isEqualAmortization)}
              </DetailField>
              <DetailField label="Partial period interest">
                {formatYesNo(product.allowPartialPeriodInterestCalculation)}
              </DetailField>
            </>
          ) : null}
          <DetailField label="Days in month">
            {enumOptionLabel(product.daysInMonthType) ?? '—'}
          </DetailField>
          <DetailField label="Days in year">
            {enumOptionLabel(product.daysInYearType) ?? '—'}
          </DetailField>
          <DetailField label="Down payment enabled">
            {formatYesNo(product.enableDownPayment)}
          </DetailField>
          <DetailField label="Interest recalculation">
            {formatYesNo(product.isInterestRecalculationEnabled)}
          </DetailField>
          <DetailField label="Multi-disburse loan">
            {formatYesNo(product.multiDisburseLoan)}
          </DetailField>
          <DetailField label="Can use for top-up">
            {formatYesNo(product.canUseForTopup)}
          </DetailField>
          <DetailField label="Hold guarantee funds">
            {formatYesNo(product.holdGuaranteeFunds)}
          </DetailField>
          <DetailField label="Grace on principal">{product.graceOnPrincipalPayment ?? '—'}</DetailField>
          <DetailField label="Grace on interest">{product.graceOnInterestPayment ?? '—'}</DetailField>
          <DetailField label="Arrears tolerance">{product.inArrearsTolerance ?? '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      {productKind === 'loan' ? (
        <DetailSection title="Loan schedule">
          <DetailFieldGrid>
            <DetailField label="Schedule type">
              {enumOptionLabel(product.loanScheduleType) ?? '—'}
            </DetailField>
            <DetailField label="Processing type">
              {enumOptionLabel(product.loanScheduleProcessingType) ?? '—'}
            </DetailField>
          </DetailFieldGrid>
        </DetailSection>
      ) : null}
    </>
  );
}

function LoanProductOverrideablesSection({ product, productKind }: SectionProps) {
  return (
    <DetailSection title="Overrideables">
      <p className="mb-4 text-sm text-muted-foreground">
        Loan officers may change these terms when opening a loan account on this product.
      </p>
      <DetailFieldGrid>
        {loanProductAttributeOverrideFields(productKind).map((field) => (
          <DetailField key={field.key} label={field.label}>
            {formatYesNo(product.allowAttributeOverrides?.[field.key])}
          </DetailField>
        ))}
      </DetailFieldGrid>
    </DetailSection>
  );
}

function LoanProductAccountingSection({ product }: { product: LoanProductDetail }) {
  const mappings = product.accountingMappings ?? {};
  const groups = new Map<string, { key: string; label: string }[]>();

  for (const field of LOAN_ACCOUNTING_FIELDS) {
    const account = mappings[field.key];
    if (!account?.id && !account?.name && !account?.glCode) {
      continue;
    }
    const list = groups.get(field.group) ?? [];
    list.push({ key: field.key, label: field.label });
    groups.set(field.group, list);
  }

  return (
    <>
      <DetailSection title="Accounting">
        <DetailFieldGrid>
          <DetailField label="Type">{accountingRuleLabel(product.accountingRule)}</DetailField>
          {product.enableAccrualActivityPosting !== undefined ? (
            <DetailField label="Accrual activity posting on due date">
              {formatYesNo(product.enableAccrualActivityPosting)}
            </DetailField>
          ) : null}
        </DetailFieldGrid>
      </DetailSection>

      {[...groups.entries()].map(([group, fields]) => (
        <DetailSection key={group} title={group}>
          <DetailFieldGrid>
            {fields.map((field) => (
              <DetailField key={field.key} label={field.label}>
                {glAccountLabel(mappings[field.key])}
              </DetailField>
            ))}
          </DetailFieldGrid>
        </DetailSection>
      ))}
    </>
  );
}

function LoanProductChannelMappingSection({ product }: { product: LoanProductDetail }) {
  const rows =
    product.paymentChannelToFundSourceMappings?.map((row) => ({
      left: row.paymentType?.name ?? '—',
      right: glAccountLabel(row.fundSourceAccount)
    })) ?? [];

  return (
    <DetailSection title="Channel mapping">
      <ProductMappingTable
        rows={rows}
        leftHeader="Payment type"
        rightHeader="Fund source"
        emptyMessage="No channel mappings."
      />
    </DetailSection>
  );
}

function LoanProductFeeGlMappingsSection({ product }: { product: LoanProductDetail }) {
  const rows =
    product.feeToIncomeAccountMappings?.map((row) => ({
      left: row.charge?.name ?? '—',
      right: glAccountLabel(row.incomeAccount)
    })) ?? [];

  return (
    <DetailSection title="Fee GL mappings">
      <ProductMappingTable
        rows={rows}
        leftHeader="Fee"
        rightHeader="Income account"
        emptyMessage="No fee mappings."
      />
    </DetailSection>
  );
}

function LoanProductPenaltyGlMappingsSection({ product }: { product: LoanProductDetail }) {
  const rows =
    product.penaltyToIncomeAccountMappings?.map((row) => ({
      left: row.charge?.name ?? '—',
      right: glAccountLabel(row.incomeAccount)
    })) ?? [];

  return (
    <DetailSection title="Penalty GL mappings">
      <ProductMappingTable
        rows={rows}
        leftHeader="Penalty"
        rightHeader="Income account"
        emptyMessage="No penalty mappings."
      />
    </DetailSection>
  );
}

type SectionProps = {
  product: LoanProductDetail;
  productKind: LoanProductKind;
};

export function LoanProductSectionPanel({
  section,
  product,
  productKind
}: {
  section: LoanProductSectionId;
  product: LoanProductDetail;
  productKind: LoanProductKind;
}) {
  switch (section) {
    case 'general':
      return <LoanProductGeneralSection product={product} productKind={productKind} />;
    case 'terms':
      return <LoanProductTermsSection product={product} />;
    case 'settings':
      return <LoanProductSettingsSection product={product} productKind={productKind} />;
    case 'overrideables':
      return <LoanProductOverrideablesSection product={product} productKind={productKind} />;
    case 'fees':
      return (
        <DetailSection title="Fees">
          <ProductChargesTable
            charges={loanProductFeeCharges(product)}
            currencyCode={loanProductCurrencyCode(product)}
            emptyMessage="No fees configured on this product."
          />
        </DetailSection>
      );
    case 'penalties':
      return (
        <DetailSection title="Penalties">
          <ProductChargesTable
            charges={loanProductPenaltyCharges(product)}
            currencyCode={loanProductCurrencyCode(product)}
            emptyMessage="No penalties configured on this product."
          />
        </DetailSection>
      );
    case 'accounting':
      return <LoanProductAccountingSection product={product} />;
    case 'channelMapping':
      return <LoanProductChannelMappingSection product={product} />;
    case 'feeGlMappings':
      return <LoanProductFeeGlMappingsSection product={product} />;
    case 'penaltyGlMappings':
      return <LoanProductPenaltyGlMappingsSection product={product} />;
    default:
      return null;
  }
}
