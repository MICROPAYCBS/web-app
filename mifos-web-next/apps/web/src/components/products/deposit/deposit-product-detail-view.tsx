'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductDetail, DepositProductKind, DepositProductSectionId } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  AlertCircle,
  ArrowLeftRight,
  Calculator,
  CircleDollarSign,
  Landmark,
  LineChart,
  Pencil,
  SlidersHorizontal,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection,
  DetailSectionNav,
  MoneyValue
} from '@/components/composites';
import { DateValue } from '@/components/composites/detail/date-value';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  depositProductConfig,
  depositProductEditPath
} from '@/lib/fineract/deposit-product-config';
import {
  DEPOSIT_PRODUCT_DEFAULT_SECTION,
  depositProductCurrencyCode,
  depositProductFeeCharges,
  depositProductPenaltyCharges,
  depositProductSectionIds,
  depositProductSections
} from '@/lib/fineract/deposit-product-sections';
import { enumOptionLabel, formatYesNo } from '@/lib/fineract/client-detail-labels';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import {
  productStatusLabel,
  productStatusVariant
} from '@/lib/fineract/product-status-display';
import { useDetailSection } from '@/hooks/use-detail-section';
import { DepositProductInterestCharts } from '@/components/products/deposit/deposit-product-interest-charts';
import { ProductChargesTable } from '@/components/products/shared/product-charges-table';
import { ProductMappingTable } from '@/components/products/shared/product-mapping-table';
import { cn } from '@/lib/utils';

const SECTION_ICONS: Record<DepositProductSectionId, LucideIcon> = {
  general: SlidersHorizontal,
  terms: Landmark,
  chart: LineChart,
  fees: CircleDollarSign,
  accounting: Calculator,
  channelMapping: ArrowLeftRight,
  feeGlMappings: CircleDollarSign,
  penaltyGlMappings: AlertCircle
};

export function DepositProductDetailView({
  kind,
  product
}: {
  kind: DepositProductKind;
  product: DepositProductDetail;
}) {
  const config = depositProductConfig(kind);
  const updatePermission =
    kind === 'recurring' ? 'UPDATE_RECURRINGDEPOSITPRODUCT' : 'UPDATE_FIXEDDEPOSITPRODUCT';
  const sectionIds = depositProductSectionIds(product);
  const navItems = depositProductSections(product).map((section) => ({
    ...section,
    icon: SECTION_ICONS[section.id]
  }));
  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    DEPOSIT_PRODUCT_DEFAULT_SECTION
  );
  const currencyCode = depositProductCurrencyCode(product);

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={config.listPath}
              label={`Back to ${config.labelPlural.toLowerCase()}`}
            />
          }
          title={product.name ?? `${config.label} #${product.id}`}
          actions={
            <Can permission={updatePermission}>
              <Link
                href={depositProductEditPath(kind, product.id)}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <Pencil className="mr-1 size-4" />
                Edit
              </Link>
            </Can>
          }
        />
      }
      sidebar={
        <DetailSectionNav
          items={navItems}
          activeId={activeSection}
          onSelect={(id) => setSection(id)}
        />
      }
    >
      {activeSection === 'general' ? (
        <DetailSection title="General">
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
            <DetailField label="Currency">{currencyCode}</DetailField>
            <DetailField label="Description">{product.description ?? '—'}</DetailField>
            <DetailField label="Accounting">
              {accountingRuleLabel(product.accountingRule)}
            </DetailField>
          </DetailFieldGrid>
        </DetailSection>
      ) : null}

      {activeSection === 'terms' ? (
        <DetailSection title="Terms">
          <DetailFieldGrid>
            <DetailField label="Default deposit amount">
              {product.depositAmount != null ? (
                <MoneyValue amount={product.depositAmount} currencyCode={currencyCode} />
              ) : (
                '—'
              )}
            </DetailField>
            <DetailField label="Minimum deposit amount">
              {product.minDepositAmount != null ? (
                <MoneyValue amount={product.minDepositAmount} currencyCode={currencyCode} />
              ) : (
                '—'
              )}
            </DetailField>
            <DetailField label="Interest compounding">
              {enumOptionLabel(product.interestCompoundingPeriodType)}
            </DetailField>
            <DetailField label="Interest posting">
              {enumOptionLabel(product.interestPostingPeriodType)}
            </DetailField>
            <DetailField label="Minimum deposit term">
              {product.minDepositTerm != null
                ? `${product.minDepositTerm} ${enumOptionLabel(product.minDepositTermType)}`
                : '—'}
            </DetailField>
            {config.isRecurring ? (
              <>
                <DetailField label="Mandatory deposit">
                  {formatYesNo(product.isMandatoryDeposit)}
                </DetailField>
                <DetailField label="Allow withdrawal">
                  {formatYesNo(product.allowWithdrawal)}
                </DetailField>
              </>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>
      ) : null}

      {activeSection === 'chart' ? <DepositProductInterestCharts product={product} /> : null}

      {activeSection === 'fees' ? (
        <div className="space-y-6">
          <DetailSection title="Fees">
            <ProductChargesTable
              charges={depositProductFeeCharges(product)}
              currencyCode={currencyCode}
              emptyMessage="No fees configured on this product."
            />
          </DetailSection>
          <DetailSection title="Penalties">
            <ProductChargesTable
              charges={depositProductPenaltyCharges(product)}
              currencyCode={currencyCode}
              emptyMessage="No penalties configured on this product."
            />
          </DetailSection>
        </div>
      ) : null}

      {activeSection === 'accounting' ? (
        <DetailSection title="Accounting">
          <DetailField label="Accounting rule">
            {accountingRuleLabel(product.accountingRule)}
          </DetailField>
        </DetailSection>
      ) : null}

      {activeSection === 'channelMapping' ? (
        <DetailSection title="Channel mapping">
          <ProductMappingTable
            rows={
              product.paymentChannelToFundSourceMappings?.map((row) => ({
                left: row.paymentType?.name ?? '—',
                right: glAccountLabel(row.fundSourceAccount)
              })) ?? []
            }
            leftHeader="Payment type"
            rightHeader="Fund source"
            emptyMessage="No channel mappings."
          />
        </DetailSection>
      ) : null}

      {activeSection === 'feeGlMappings' ? (
        <DetailSection title="Fee GL mappings">
          <ProductMappingTable
            rows={
              product.feeToIncomeAccountMappings?.map((row) => ({
                left: row.charge?.name ?? '—',
                right: glAccountLabel(row.incomeAccount)
              })) ?? []
            }
            leftHeader="Fee"
            rightHeader="Income account"
            emptyMessage="No fee mappings."
          />
        </DetailSection>
      ) : null}

      {activeSection === 'penaltyGlMappings' ? (
        <DetailSection title="Penalty GL mappings">
          <ProductMappingTable
            rows={
              product.penaltyToIncomeAccountMappings?.map((row) => ({
                left: row.charge?.name ?? '—',
                right: glAccountLabel(row.incomeAccount)
              })) ?? []
            }
            leftHeader="Penalty"
            rightHeader="Income account"
            emptyMessage="No penalty mappings."
          />
        </DetailSection>
      ) : null}
    </DetailPage>
  );
}
