'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductDetail, SavingsProductSectionId } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  AlertCircle,
  ArrowLeftRight,
  Calculator,
  CircleDollarSign,
  Landmark,
  Pencil,
  SlidersHorizontal,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { DetailBackLink, DetailHeader, DetailPage, DetailSectionNav } from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import { savingsProductEditPath } from '@/lib/fineract/savings-product-paths';
import { cn } from '@/lib/utils';
import { SavingsProductSectionPanel } from '@/components/products/savings/savings-product-section-panels';
import { useDetailSection } from '@/hooks/use-detail-section';
import {
  SAVINGS_PRODUCT_DEFAULT_SECTION,
  savingsProductSectionIds,
  savingsProductSections
} from '@/lib/fineract/savings-product-sections';

const SAVINGS_SECTION_ICONS: Record<SavingsProductSectionId, LucideIcon> = {
  general: SlidersHorizontal,
  terms: Landmark,
  fees: CircleDollarSign,
  accounting: Calculator,
  channelMapping: ArrowLeftRight,
  feeGlMappings: CircleDollarSign,
  penaltyGlMappings: AlertCircle
};

export function SavingsProductDetailView({
  product
}: {
  product: SavingsProductDetail;
}) {
  const sectionIds = savingsProductSectionIds(product);
  const navItems = savingsProductSections(product).map((section) => ({
    ...section,
    icon: SAVINGS_SECTION_ICONS[section.id]
  }));
  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    SAVINGS_PRODUCT_DEFAULT_SECTION
  );

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink href="/products/savings-products" label="Back to deposit products" />
          }
          title={product.name ?? `Deposit product #${product.id}`}
          actions={
            <Can permission="UPDATE_SAVINGSPRODUCT">
              <Link
                href={savingsProductEditPath(product.id)}
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
      <SavingsProductSectionPanel
        section={activeSection as SavingsProductSectionId}
        product={product}
      />
    </DetailPage>
  );
}
