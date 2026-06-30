'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ClientCollateralListItem,
  ClientCollateralTemplate,
  CollateralProductDetail
} from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import {
  createClientCollateralAction,
  fetchClientCollateralTemplateAction,
  fetchCollateralProductAction
} from '@/actions/client-collateral';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { MoneyValue } from '@/components/composites/detail/money-value';
import {
  isClientCollateralActionError,
  isClientCollateralTemplate,
  isCollateralProductDetail
} from '@/lib/fineract/client-collateral-action-result';
import {
  buildClientCollateralListItem,
  clientCollateralTotalCollateralValue,
  clientCollateralTotalValue
} from '@/lib/fineract/client-collateral-display';
import { collateralProductCurrencyCode } from '@/lib/fineract/collateral-product-display';
import { toSelectOptions } from '@/lib/form/select-options';

export const CREATE_CLIENT_COLLATERAL_FORM_ID = 'create-client-collateral-form';

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

export function CreateClientCollateralSheet({
  clientId,
  initialTemplate,
  open,
  onOpenChange,
  onCreated
}: {
  clientId: string;
  initialTemplate: ClientCollateralTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (created?: ClientCollateralListItem) => void;
}) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [collateralId, setCollateralId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [product, setProduct] = useState<CollateralProductDetail | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingProduct, startLoadProduct] = useTransition();

  const qty = quantity ? Number(quantity) : NaN;
  const previewItem =
    product && Number.isFinite(qty) && qty > 0
      ? {
          basePrice: product.basePrice,
          pctToBase: product.pctToBase,
          quantity: qty,
          currency: product.currency
        }
      : null;

  const loadProduct = useCallback(
    (id: string) => {
      if (!id) {
        setProduct(null);
        return;
      }
      startLoadProduct(async () => {
        const result = await fetchCollateralProductAction(id);
        if (!isCollateralProductDetail(result)) {
          setLoadError(
            isClientCollateralActionError(result)
              ? result.message
              : 'Could not load collateral details.'
          );
          setProduct(null);
          return;
        }
        setLoadError(null);
        setProduct(result);
      });
    },
    []
  );

  useEffect(() => {
    if (!open) {
      setTemplate(initialTemplate);
      return;
    }
    setTemplate(initialTemplate);
    setCollateralId('');
    setQuantity('');
    setProduct(null);
    setFieldErrors({});
    setSubmitError(null);
    setLoadError(null);
    startTransition(async () => {
      const result = await fetchClientCollateralTemplateAction(clientId);
      if (isClientCollateralTemplate(result)) {
        setTemplate(result);
      }
    });
  }, [open, initialTemplate, clientId]);

  function handleCollateralChange(value: string) {
    setCollateralId(value);
    loadProduct(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await createClientCollateralAction(clientId, {
        collateralId,
        quantity
      });
      if (!result.ok) {

        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Collateral added.', pending: 'Collateral added sent for approval.' });
      onOpenChange(false);
      const qtyNum = Number(quantity);
      if (product && result.resourceId && Number.isFinite(qtyNum) && qtyNum > 0) {
        onCreated?.(buildClientCollateralListItem(product, result.resourceId, qtyNum));
      } else {
        onCreated?.();
      }
      router.refresh();
    });
  }

  const disabled = pending || loadingProduct;
  const collateralOptions = useMemo(
    () => toSelectOptions(template.collateralOptions),
    [template.collateralOptions]
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add collateral"
      description="Link a collateral product to this customer with a quantity."
      formId={CREATE_CLIENT_COLLATERAL_FORM_ID}
      submitLabel="Add"
      submitLoading={pending}
      submitDisabled={disabled || collateralOptions.length === 0}
    >
      {loadError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formatActionErrorMessage(submitError, fieldErrors)}
        </p>
      ) : null}
      <form id={CREATE_CLIENT_COLLATERAL_FORM_ID} onSubmit={handleSubmit}>
        <div className="space-y-4">
          <SelectField
            label="Collateral product"
            required
            value={collateralId || undefined}
            onValueChange={(v) => handleCollateralChange(v ?? '')}
            options={collateralOptions}
            placeholder="Select collateral"
            disabled={disabled}
            error={fieldErrors.collateralId}
            emptyMessage="No collateral products available."
          />

          {product ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-foreground">{product.name}</p>
              <dl className="mt-2 grid gap-1 text-muted-foreground">
                {product.quality ? (
                  <div>
                    <span className="text-foreground">Quality: </span>
                    {product.quality}
                  </div>
                ) : null}
                {product.unitType ? (
                  <div>
                    <span className="text-foreground">Unit: </span>
                    {product.unitType}
                  </div>
                ) : null}
                {product.basePrice !== undefined ? (
                  <div>
                    <span className="text-foreground">Base price: </span>
                    <MoneyValue
                      amount={product.basePrice}
                      currencyCode={collateralProductCurrencyCode(product.currency) ?? 'USD'}
                    />
                  </div>
                ) : null}
                {product.pctToBase !== undefined ? (
                  <div>
                    <span className="text-foreground">Percent to base: </span>
                    {product.pctToBase}%
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          <NumericField
            id="cc-quantity"
            label="Quantity"
            required
            integer
            value={quantity}
            disabled={disabled}
            onChange={setQuantity}
            error={fieldErrors.quantity}
          />

          {previewItem ? (
            <div className="rounded-lg border border-border p-4 text-sm">
              <p className="mb-2 font-medium">Calculated values</p>
              <dl className="grid gap-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Total value</dt>
                  <dd>
                    <MoneyValue
                      amount={clientCollateralTotalValue(previewItem)}
                      currencyCode={collateralProductCurrencyCode(previewItem.currency) ?? 'USD'}
                    />
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Total collateral value</dt>
                  <dd>
                    <MoneyValue
                      amount={clientCollateralTotalCollateralValue(previewItem)}
                      currencyCode={collateralProductCurrencyCode(previewItem.currency) ?? 'USD'}
                    />
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </form>
    </FormSheet>
  );
}
