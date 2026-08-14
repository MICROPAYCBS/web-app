'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductDetail, LoanProductKind, LoanProductSectionId } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  AlertCircle,
  ArrowLeftRight,
  Calculator,
  CircleDollarSign,
  Landmark,
  Pencil,
  Settings2,
  SlidersHorizontal,
  Unlock,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { DetailBackLink, DetailHeader, DetailPage, DetailSectionNav } from '@/components/composites';
import { LoanProductSectionPanel } from '@/components/products/loan/loan-product-section-panels';
import { buttonVariants } from '@/components/ui/button';
import { useDetailSection } from '@/hooks/use-detail-section';
import {
  loanProductEditPath,
  loanProductListPath
} from '@/lib/fineract/loan-product-paths';
import {
  LOAN_PRODUCT_DEFAULT_SECTION,
  loanProductSectionIds,
  loanProductSections
} from '@/lib/fineract/loan-product-sections';
import { cn } from '@/lib/utils';

const LOAN_SECTION_ICONS: Record<LoanProductSectionId, LucideIcon> = {
  general: SlidersHorizontal,
  terms: Landmark,
  settings: Settings2,
  overrideables: Unlock,
  fees: CircleDollarSign,
  penalties: AlertCircle,
  accounting: Calculator,
  channelMapping: ArrowLeftRight,
  feeGlMappings: CircleDollarSign,
  penaltyGlMappings: AlertCircle
};

export function LoanProductDetailView({
  product,
  productKind
}: {
  product: LoanProductDetail;
  productKind: LoanProductKind;
}) {
  const sectionIds = loanProductSectionIds(product, productKind);
  const navItems = loanProductSections(product, productKind).map((section) => ({
    ...section,
    icon: LOAN_SECTION_ICONS[section.id]
  }));
  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    LOAN_PRODUCT_DEFAULT_SECTION
  );

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={loanProductListPath(productKind)}
              label="Back to loan products"
            />
          }
          title={product.name ?? `Loan product #${product.id}`}
          actions={
            <Can permission="UPDATE_LOANPRODUCT">
              <Link
                href={loanProductEditPath(product.id, productKind)}
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
      <LoanProductSectionPanel
        section={activeSection as LoanProductSectionId}
        product={product}
        productKind={productKind}
      />
    </DetailPage>
  );
}
