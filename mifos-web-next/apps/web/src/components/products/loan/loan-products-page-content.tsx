'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductKind, LoanProductListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import {
  countActiveLoanProductFilters,
  LoanProductsFilterSheet
} from '@/components/products/loan/loan-products-filter-sheet';
import { LoanProductsTable } from '@/components/products/loan/loan-products-table';
import { buttonVariants } from '@/components/ui/button';
import {
  LOAN_PRODUCT_KIND,
  loanProductCreatePath,
  loanProductListPath
} from '@/lib/fineract/loan-product-paths';
import { cn } from '@/lib/utils';

export function LoanProductsPageContent({
  products,
  productKind,
  loadError
}: {
  products: LoanProductListItem[];
  productKind: LoanProductKind;
  loadError?: string;
}) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftKind, setDraftKind] = useState(productKind);
  const activeFilterCount = countActiveLoanProductFilters(productKind);

  useEffect(() => {
    setDraftKind(productKind);
  }, [productKind]);

  function handleApplyFilters(kind: LoanProductKind) {
    router.push(loanProductListPath(kind));
  }

  function handleClearFilters() {
    router.push(loanProductListPath(LOAN_PRODUCT_KIND.LOAN));
  }

  return (
    <>
      <ListPage
        title="Loan products"
        description="Loan and working capital product definitions used when opening new loan accounts."
        actions={
          <Can permission="CREATE_LOANPRODUCT">
            <Link href={loanProductCreatePath(productKind)} className={cn(buttonVariants())}>
              Create loan product
            </Link>
          </Can>
        }
      >
        {loadError ? (
          <LoadErrorAlert message={loadError} title="Could not load loan products" />
        ) : null}
        <LoanProductsTable
          products={products}
          productKind={productKind}
          filterTrigger={
            <ListFilterTrigger
              activeCount={activeFilterCount}
              onClick={() => setFilterOpen(true)}
            />
          }
        />
      </ListPage>

      <LoanProductsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        draftKind={draftKind}
        onDraftKindChange={setDraftKind}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </>
  );
}
