'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteProductMixAction } from '@/actions/product-mix';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { ProductMixProductsTable } from '@/components/products/product-mix/product-mix-products-table';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { productMixEditPath, productMixListPath } from '@/lib/fineract/product-mix-paths';
import { cn } from '@/lib/utils';

export function ProductMixDetailView({
  mix,
  canEdit,
  canDelete
}: {
  mix: ProductMixDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const title = mix.productName ?? `Product #${mix.productId}`;

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteProductMixAction(String(mix.productId));
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(productMixListPath());
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href={productMixListPath()} label="Back to product mix" />}
            title={title}
            actions={
              canEdit || canDelete ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={productMixEditPath(mix.productId)}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Pencil className="mr-1 size-4" />
                      Edit
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      disabled={pending}
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-1 size-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              ) : null
            }
          />
        }
      >
        <DetailSection title="Restricted products">
          <ProductMixProductsTable
            title=""
            products={mix.restrictedProducts}
            emptyMessage="No restricted products configured."
          />
        </DetailSection>
        <DetailSection title="Allowed products">
          <ProductMixProductsTable
            title=""
            products={mix.allowedProducts}
            emptyMessage="No allowed products listed."
          />
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product mix?</DialogTitle>
            <DialogDescription>
              This removes the product mix for {title}. Customers will no longer be restricted from
              holding the selected products together.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
