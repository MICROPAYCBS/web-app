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
import { ListPage } from '@/components/composites/list-page';
import { LoanProductsTable } from '@/components/products/loan/loan-products-table';
import { buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  LOAN_PRODUCT_KIND,
  loanProductCreatePath,
  loanProductKindLabel,
  loanProductListPath
} from '@/lib/fineract/loan-product-paths';
import { cn } from '@/lib/utils';

export function LoanProductsPageContent({
  products,
  productKind
}: {
  products: LoanProductListItem[];
  productKind: LoanProductKind;
}) {
  const router = useRouter();

  return (
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
      toolbar={
        <div className="flex max-w-xs flex-col gap-2">
          <Label htmlFor="loan-product-kind">Product type</Label>
          <Select
            value={productKind}
            onValueChange={(value) => {
              router.push(loanProductListPath(value as LoanProductKind));
            }}
          >
            <SelectTrigger id="loan-product-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LOAN_PRODUCT_KIND.LOAN}>
                {loanProductKindLabel(LOAN_PRODUCT_KIND.LOAN)}
              </SelectItem>
              <SelectItem value={LOAN_PRODUCT_KIND.WORKING_CAPITAL}>
                {loanProductKindLabel(LOAN_PRODUCT_KIND.WORKING_CAPITAL)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <LoanProductsTable products={products} productKind={productKind} />
    </ListPage>
  );
}
