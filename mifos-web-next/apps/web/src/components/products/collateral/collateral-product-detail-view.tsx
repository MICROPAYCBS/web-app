'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollateralProductDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteCollateralProductAction } from '@/actions/collateral-product';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection,
  MoneyValue
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  collateralProductCurrencyCode,
  collateralProductCurrencyLabel
} from '@/lib/fineract/collateral-product-display';
import {
  COLLATERAL_PRODUCT_BASE_PRICE_HINT,
  COLLATERAL_PRODUCT_PCT_TO_BASE_HINT
} from '@/lib/fineract/collateral-product-field-hints';
import { collateralProductEditPath } from '@/lib/fineract/collateral-product-paths';
import { cn } from '@/lib/utils';

export function CollateralProductDetailView({
  product,
  canEdit,
  canDelete
}: {
  product: CollateralProductDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteCollateralProductAction(String(product.id));
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push('/products/collaterals');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href="/products/collaterals" label="Back to collateral products" />
            }
            title={product.name ?? `Collateral #${product.id}`}
            actions={
              canEdit || canDelete ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={collateralProductEditPath(product.id)}
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
        <DetailSection title="Details">
          <DetailFieldGrid>
            <DetailField label="Name">{product.name ?? '—'}</DetailField>
            <DetailField label="Type/quality">{product.quality ?? '—'}</DetailField>
            <DetailField label="Base price" hint={COLLATERAL_PRODUCT_BASE_PRICE_HINT}>
              <MoneyValue
                amount={product.basePrice}
                currencyCode={collateralProductCurrencyCode(product.currency) ?? 'USD'}
              />
            </DetailField>
            <DetailField
              label="Percentage to base"
              hint={COLLATERAL_PRODUCT_PCT_TO_BASE_HINT}
            >
              {product.pctToBase !== undefined ? `${product.pctToBase}%` : '—'}
            </DetailField>
            <DetailField label="Unit type">{product.unitType ?? '—'}</DetailField>
            <DetailField label="Currency">
              {collateralProductCurrencyLabel(product.currency)}
            </DetailField>
          </DetailFieldGrid>
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete collateral product?</DialogTitle>
            <DialogDescription>
              This permanently removes {product.name ?? 'this collateral product'}. Client
              collateral links that reference it may be affected.
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
