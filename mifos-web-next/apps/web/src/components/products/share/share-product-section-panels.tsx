'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductDetail, ShareProductSectionId } from '@mifos/api-client';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  MoneyValue
} from '@/components/composites';
import { ProductChargesTable } from '@/components/products/shared/product-charges-table';
import { enumOptionLabel, formatYesNo } from '@/lib/fineract/client-detail-labels';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import {
  accountingRuleLabel,
  glAccountLabel
} from '@/lib/fineract/product-display';
import {
  shareProductCurrencyCode,
  shareProductFeeCharges
} from '@/lib/fineract/share-product-sections';

const SHARE_ACCOUNTING_FIELDS: { key: string; label: string }[] = [
  { key: 'shareReferenceId', label: 'Share reference' },
  { key: 'shareSuspenseId', label: 'Share suspense' },
  { key: 'shareEquityId', label: 'Share equity' },
  { key: 'incomeFromFeeAccountId', label: 'Income from fees' }
];

function ShareProductGeneralSection({ product }: { product: ShareProductDetail }) {
  const currency = shareProductCurrencyCode(product);

  return (
    <>
      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Short name">{product.shortName ?? '—'}</DetailField>
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

function ShareProductTermsSection({ product }: { product: ShareProductDetail }) {
  const currency = shareProductCurrencyCode(product);

  return (
    <DetailSection title="Terms">
      <DetailFieldGrid>
        <DetailField label="Total shares">
          {product.totalShares != null ? product.totalShares.toLocaleString() : '—'}
        </DetailField>
        <DetailField label="Shares issued">
          {product.totalSharesIssued != null
            ? product.totalSharesIssued.toLocaleString()
            : '—'}
        </DetailField>
        <DetailField label="Unit price">
          <MoneyValue amount={product.unitPrice} currencyCode={currency} />
        </DetailField>
        <DetailField label="Share capital">
          <MoneyValue amount={product.shareCapital} currencyCode={currency} />
        </DetailField>
        <DetailField label="Minimum shares">{product.minimumShares ?? '—'}</DetailField>
        <DetailField label="Nominal shares">{product.nominalShares ?? '—'}</DetailField>
        <DetailField label="Maximum shares">{product.maximumShares ?? '—'}</DetailField>
        <DetailField label="Minimum active period for dividends">
          {product.minimumActivePeriod ?? '—'}
        </DetailField>
        <DetailField label="Minimum active period type">
          {enumOptionLabel(product.minimumActivePeriodForDividendsTypeEnum) ?? '—'}
        </DetailField>
        <DetailField label="Lock-in period">{product.lockinPeriod ?? '—'}</DetailField>
        <DetailField label="Lock-in period type">
          {enumOptionLabel(product.lockPeriodTypeEnum) ?? '—'}
        </DetailField>
        <DetailField label="Allow dividends for inactive clients">
          {formatYesNo(product.allowDividendCalculationForInactiveClients)}
        </DetailField>
      </DetailFieldGrid>
    </DetailSection>
  );
}

function ShareProductMarketPriceSection({ product }: { product: ShareProductDetail }) {
  const currency = shareProductCurrencyCode(product);

  return (
    <DetailSection title="Market price">
      {(product.marketPrice ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No market price periods defined.</p>
      ) : (
        <DetailFieldGrid columns={1}>
          {(product.marketPrice ?? []).map((period, index) => (
            <DetailField
              key={index}
              label={formatFineractDateArray(period.fromDate) ?? period.fromDate ?? '—'}
            >
              <MoneyValue amount={period.shareValue} currencyCode={currency} />
            </DetailField>
          ))}
        </DetailFieldGrid>
      )}
    </DetailSection>
  );
}

function ShareProductFeesSection({ product }: { product: ShareProductDetail }) {
  const currency = shareProductCurrencyCode(product);
  const charges = shareProductFeeCharges(product);

  return (
    <DetailSection title="Fees">
      <ProductChargesTable
        charges={charges}
        currencyCode={currency}
        emptyMessage="No fees attached to this product."
      />
    </DetailSection>
  );
}

function ShareProductAccountingSection({ product }: { product: ShareProductDetail }) {
  const mappings = product.accountingMappings ?? {};

  return (
    <DetailSection title="Accounting">
      <DetailFieldGrid>
        <DetailField label="Accounting rule">
          {accountingRuleLabel(product.accountingRule) ?? '—'}
        </DetailField>
        {SHARE_ACCOUNTING_FIELDS.map(({ key, label }) => {
          const account = mappings[key];
          return account ? (
            <DetailField key={key} label={label}>
              {glAccountLabel(account)}
            </DetailField>
          ) : null;
        })}
      </DetailFieldGrid>
    </DetailSection>
  );
}

export function ShareProductSectionPanel({
  product,
  section
}: {
  product: ShareProductDetail;
  section: ShareProductSectionId;
}) {
  switch (section) {
    case 'general':
      return <ShareProductGeneralSection product={product} />;
    case 'terms':
      return <ShareProductTermsSection product={product} />;
    case 'marketPrice':
      return <ShareProductMarketPriceSection product={product} />;
    case 'fees':
      return <ShareProductFeesSection product={product} />;
    case 'accounting':
      return <ShareProductAccountingSection product={product} />;
    default:
      return null;
  }
}
