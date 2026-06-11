'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixCreateTemplate, ProductMixDetail } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createProductMixAction,
  fetchProductMixFormOptionsAction,
  updateProductMixAction
} from '@/actions/product-mix';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { ProductMixRestrictedProductsField } from '@/components/products/product-mix/product-mix-restricted-products-field';
import {
  productMixDetailPath,
  productMixListPath
} from '@/lib/fineract/product-mix-paths';
import { productMixSelectableOptions } from '@/lib/fineract/product-mix-display';

export const CREATE_PRODUCT_MIX_FORM_ID = 'create-product-mix-form';
export const EDIT_PRODUCT_MIX_FORM_ID = 'edit-product-mix-form';

function productOptions(template: ProductMixCreateTemplate) {
  return template.productOptions.map((product) => ({
    value: String(product.id),
    label: product.name ?? `Product #${product.id}`
  }));
}

export function ProductMixCreateSheet({
  template,
  open,
  onOpenChange
}: {
  template: ProductMixCreateTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingOptions, startOptionsTransition] = useTransition();
  const [productId, setProductId] = useState<string | undefined>();
  const [restrictedProducts, setRestrictedProducts] = useState<number[]>([]);
  const [selectableOptions, setSelectableOptions] = useState<
    { id: number; name?: string }[]
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const products = useMemo(() => productOptions(template), [template]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setProductId(undefined);
    setRestrictedProducts([]);
    setSelectableOptions([]);
    setFieldErrors({});
    setSubmitError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !productId) {
      setSelectableOptions([]);
      setRestrictedProducts([]);
      return;
    }

    startOptionsTransition(async () => {
      const result = await fetchProductMixFormOptionsAction(productId);
      if (!result.ok) {
        setSubmitError(result.message);
        setSelectableOptions([]);
        setRestrictedProducts([]);
        return;
      }

      const combined = [...result.restrictedProducts, ...result.allowedProducts];
      const byId = new Map<number, { id: number; name?: string }>();
      for (const option of combined) {
        byId.set(option.id, option);
      }
      const options = [...byId.values()].sort((a, b) =>
        (a.name ?? String(a.id)).localeCompare(b.name ?? String(b.id))
      );
      setSelectableOptions(options);
      setRestrictedProducts(result.restrictedProducts.map((item) => item.id));
      setSubmitError(null);
    });
  }, [open, productId]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createProductMixAction({
        productId: productId ?? '',
        restrictedProducts
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Product mix created.');
      onOpenChange(false);
      const id = result.productId;
      router.push(id ? productMixDetailPath(id) : productMixListPath());
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create product mix"
      description="Choose a loan product and mark other products that cannot be held with it."
      formId={CREATE_PRODUCT_MIX_FORM_ID}
      submitLabel="Create"
      submitLoading={pending || loadingOptions}
    >
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}
      <form id={CREATE_PRODUCT_MIX_FORM_ID} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <SelectField
            label="Loan product"
            required
            value={productId}
            onValueChange={setProductId}
            options={products}
            placeholder="Select a loan product"
            error={fieldErrors.productId}
            disabled={pending}
          />
          {productId ? (
            <ProductMixRestrictedProductsField
              label="Restricted products"
              options={selectableOptions}
              value={restrictedProducts}
              onChange={setRestrictedProducts}
              error={fieldErrors.restrictedProducts}
              disabled={pending || loadingOptions}
            />
          ) : null}
        </div>
      </form>
    </FormSheet>
  );
}

export function ProductMixEditSheet({
  mix,
  open,
  onOpenChange
}: {
  mix: ProductMixDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [restrictedProducts, setRestrictedProducts] = useState<number[]>(
    mix.restrictedProducts.map((product) => product.id)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectableOptions = useMemo(() => productMixSelectableOptions(mix), [mix]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setRestrictedProducts(mix.restrictedProducts.map((product) => product.id));
    setFieldErrors({});
    setSubmitError(null);
  }, [open, mix]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateProductMixAction(String(mix.productId), {
        restrictedProducts
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Product mix updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit product mix"
      description={mix.productName ?? `Product #${mix.productId}`}
      formId={EDIT_PRODUCT_MIX_FORM_ID}
      submitLabel="Save changes"
      submitLoading={pending}
    >
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}
      <form id={EDIT_PRODUCT_MIX_FORM_ID} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <ProductMixRestrictedProductsField
            label="Restricted products"
            options={selectableOptions}
            value={restrictedProducts}
            onChange={setRestrictedProducts}
            error={fieldErrors.restrictedProducts}
            disabled={pending}
          />
        </div>
      </form>
    </FormSheet>
  );
}
