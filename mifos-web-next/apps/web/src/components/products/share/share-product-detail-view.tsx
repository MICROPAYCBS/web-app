'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductDetail, ShareProductSectionId } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import {
  Calculator,
  CircleDollarSign,
  Landmark,
  LineChart,
  Pencil,
  SlidersHorizontal,
  type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { DetailBackLink, DetailHeader, DetailPage, DetailSectionNav } from '@/components/composites';
import { ShareProductSectionPanel } from '@/components/products/share/share-product-section-panels';
import { buttonVariants } from '@/components/ui/button';
import { shareProductEditPath } from '@/lib/fineract/share-product-paths';
import {
  SHARE_PRODUCT_DEFAULT_SECTION,
  shareProductSectionIds,
  shareProductSections
} from '@/lib/fineract/share-product-sections';
import { cn } from '@/lib/utils';
import { useDetailSection } from '@/hooks/use-detail-section';

const SHARE_SECTION_ICONS: Record<ShareProductSectionId, LucideIcon> = {
  general: SlidersHorizontal,
  terms: Landmark,
  marketPrice: LineChart,
  fees: CircleDollarSign,
  accounting: Calculator
};

export function ShareProductDetailView({
  product
}: {
  product: ShareProductDetail;
}) {
  const sectionIds = shareProductSectionIds(product);
  const navItems = shareProductSections(product).map((section) => ({
    ...section,
    icon: SHARE_SECTION_ICONS[section.id]
  }));
  const { activeSection, setSection } = useDetailSection(
    sectionIds,
    SHARE_PRODUCT_DEFAULT_SECTION
  );

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink href="/products/share-products" label="Back to share products" />
          }
          title={product.name ?? `Share product #${product.id}`}
          actions={
            <Can permission="UPDATE_SHAREPRODUCT">
              <Link
                href={shareProductEditPath(product.id)}
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
      <ShareProductSectionPanel
        section={activeSection as ShareProductSectionId}
        product={product}
      />
    </DetailPage>
  );
}
