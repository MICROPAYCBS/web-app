'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductDetail, SavingsProductSectionId } from '@mifos/api-client';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  MoneyValue
} from '@/components/composites';
import { DateValue } from '@/components/composites/detail/date-value';
import { Badge } from '@/components/ui/badge';
import { ProductChargesTable } from '@/components/products/shared/product-charges-table';
import { ProductMappingTable } from '@/components/products/shared/product-mapping-table';
import { enumOptionLabel, formatYesNo } from '@/lib/fineract/client-detail-labels';
import {
  accountingRuleLabel,
  glAccountLabel
} from '@/lib/fineract/product-display';
import {
  productStatusLabel,
  productStatusVariant
} from '@/lib/fineract/product-status-display';
import {
  savingsProductCurrencyCode,
  savingsProductFeeCharges
} from '@/lib/fineract/savings-product-sections';

const SAVINGS_ACCOUNTING_FIELDS: { key: string; label: string; group: string }[] = [
  { key: 'savingsReferenceAccount', label: 'Saving reference', group: 'Assets' },
  { key: 'overdraftPortfolioControl', label: 'Overdraft portfolio control', group: 'Assets' },
  { key: 'savingsControlAccount', label: 'Saving control', group: 'Liabilities' },
  { key: 'transfersInSuspenseAccount', label: 'Transfer in suspense', group: 'Liabilities' },
  { key: 'interestOnSavingsAccount', label: 'Interest on savings', group: 'Expenses' },
  { key: 'incomeFromFeeAccount', label: 'Income from fees', group: 'Income' },
  { key: 'incomeFromPenaltyAccount', label: 'Income from penalties', group: 'Income' },
  { key: 'incomeFromInterest', label: 'Income from interest', group: 'Income' }
];

function SavingsProductGeneralSection({ product }: { product: SavingsProductDetail }) {
  const currency = savingsProductCurrencyCode(product);

  return (
    <>
      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Short name">{product.shortName ?? '—'}</DetailField>
          <DetailField label="Status">
            <Badge variant={productStatusVariant(product.status)}>
              {productStatusLabel(product.status)}
            </Badge>
          </DetailField>
          <DetailField label="Start date">
            <DateValue value={product.startDate} />
          </DetailField>
          <DetailField label="Expiry date">
            <DateValue value={product.closeDate} />
          </DetailField>
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
        </DetailFieldGrid>
      </DetailSection>
    </>
  );
}

function SavingsProductTermsSection({ product }: { product: SavingsProductDetail }) {
  const currency = savingsProductCurrencyCode(product);

  return (
    <DetailSection title="Terms">
      <DetailFieldGrid>
        <DetailField label="Nominal annual interest">
          {product.nominalAnnualInterestRate !== undefined
            ? `${product.nominalAnnualInterestRate}%`
            : '—'}
        </DetailField>
        <DetailField label="Interest compounding period">
          {enumOptionLabel(product.interestCompoundingPeriodType) ?? '—'}
        </DetailField>
        <DetailField label="Interest posting period">
          {enumOptionLabel(product.interestPostingPeriodType) ?? '—'}
        </DetailField>
        <DetailField label="Interest calculation">
          {enumOptionLabel(product.interestCalculationType) ?? '—'}
        </DetailField>
        <DetailField label="Days in year">
          {enumOptionLabel(product.interestCalculationDaysInYearType) ?? '—'}
        </DetailField>
        <DetailField label="Minimum opening balance">
          <MoneyValue amount={product.minRequiredOpeningBalance} currencyCode={currency} />
        </DetailField>
        <DetailField label="Minimum balance for interest">
          <MoneyValue
            amount={product.minBalanceForInterestCalculation}
            currencyCode={currency}
          />
        </DetailField>
        <DetailField label="Lock-in period">
          {product.lockinPeriodFrequency !== undefined && product.lockinPeriodFrequencyType
            ? `${product.lockinPeriodFrequency} ${enumOptionLabel(product.lockinPeriodFrequencyType) ?? ''}`.trim()
            : (product.lockinPeriodFrequency ?? '—')}
        </DetailField>
        <DetailField label="Withdrawal fee for transfers">
          {formatYesNo(product.withdrawalFeeForTransfers)}
        </DetailField>
        <DetailField label="Allow overdraft">
          {formatYesNo(product.allowOverdraft)}
        </DetailField>
        <DetailField label="Overdraft limit">
          <MoneyValue amount={product.overdraftLimit} currencyCode={currency} />
        </DetailField>
      </DetailFieldGrid>
    </DetailSection>
  );
}

function SavingsProductAccountingSection({ product }: { product: SavingsProductDetail }) {
  const mappings = product.accountingMappings ?? {};
  const groups = new Map<string, { key: string; label: string }[]>();

  for (const field of SAVINGS_ACCOUNTING_FIELDS) {
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

function SavingsProductChannelMappingSection({ product }: { product: SavingsProductDetail }) {
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
        rightHeader="Debit GL (fund source)"
        emptyMessage="No channel mappings."
      />
    </DetailSection>
  );
}

function SavingsProductFeeGlMappingsSection({ product }: { product: SavingsProductDetail }) {
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

function SavingsProductPenaltyGlMappingsSection({ product }: { product: SavingsProductDetail }) {
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

export function SavingsProductSectionPanel({
  section,
  product
}: {
  section: SavingsProductSectionId;
  product: SavingsProductDetail;
}) {
  switch (section) {
    case 'general':
      return <SavingsProductGeneralSection product={product} />;
    case 'terms':
      return <SavingsProductTermsSection product={product} />;
    case 'fees':
      return (
        <DetailSection title="Fees">
          <ProductChargesTable
            charges={savingsProductFeeCharges(product)}
            currencyCode={savingsProductCurrencyCode(product)}
            emptyMessage="No fees configured on this product."
          />
        </DetailSection>
      );
    case 'accounting':
      return <SavingsProductAccountingSection product={product} />;
    case 'channelMapping':
      return <SavingsProductChannelMappingSection product={product} />;
    case 'feeGlMappings':
      return <SavingsProductFeeGlMappingsSection product={product} />;
    case 'penaltyGlMappings':
      return <SavingsProductPenaltyGlMappingsSection product={product} />;
    default:
      return null;
  }
}
