'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollateralProductDetail, CollateralProductTemplate } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createCollateralProductAction,
  updateCollateralProductAction
} from '@/actions/collateral-product';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { collateralProductCurrencyCode } from '@/lib/fineract/collateral-product-display';
import {
  collateralProductDetailPath,
  collateralProductListPath
} from '@/lib/fineract/collateral-product-paths';
import {
  COLLATERAL_PRODUCT_BASE_PRICE_HINT,
  COLLATERAL_PRODUCT_PCT_TO_BASE_HINT
} from '@/lib/fineract/collateral-product-field-hints';

export const CREATE_COLLATERAL_PRODUCT_FORM_ID = 'create-collateral-product-form';
export const EDIT_COLLATERAL_PRODUCT_FORM_ID = 'edit-collateral-product-form';

function currencyOptions(template: CollateralProductTemplate) {
  return template.currencyOptions.map((currency) => ({
    value: currency.code ?? '',
    label: currency.name ? `${currency.name} (${currency.code})` : (currency.code ?? '')
  }));
}

export function CollateralProductCreateSheet({
  template,
  open,
  onOpenChange
}: {
  template: CollateralProductTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [quality, setQuality] = useState('');
  const [unitType, setUnitType] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [pctToBase, setPctToBase] = useState('');
  const [currency, setCurrency] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currencies = useMemo(() => currencyOptions(template), [template]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName('');
    setQuality('');
    setUnitType('');
    setBasePrice('');
    setPctToBase('');
    setCurrency(undefined);
    setFieldErrors({});
    setSubmitError(null);
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createCollateralProductAction({
        name,
        quality,
        unitType,
        basePrice,
        pctToBase,
        currency: currency ?? ''
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Collateral product created.');
      onOpenChange(false);
      const id = result.resourceId;
      router.push(id ? collateralProductDetailPath(id) : collateralProductListPath());
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create collateral product"
      description="Define a collateral type with base price, percentage, and currency."
      formId={CREATE_COLLATERAL_PRODUCT_FORM_ID}
      submitLabel="Create"
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
      <form id={CREATE_COLLATERAL_PRODUCT_FORM_ID} onSubmit={handleSubmit}>
        <CollateralProductFields
          name={name}
          setName={setName}
          quality={quality}
          setQuality={setQuality}
          unitType={unitType}
          setUnitType={setUnitType}
          basePrice={basePrice}
          setBasePrice={setBasePrice}
          pctToBase={pctToBase}
          setPctToBase={setPctToBase}
          currency={currency}
          setCurrency={setCurrency}
          currencies={currencies}
          fieldErrors={fieldErrors}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

export function CollateralProductEditSheet({
  product,
  template,
  open,
  onOpenChange
}: {
  product: CollateralProductDetail;
  template: CollateralProductTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(product.name ?? '');
  const [quality, setQuality] = useState(product.quality ?? '');
  const [unitType, setUnitType] = useState(product.unitType ?? '');
  const [basePrice, setBasePrice] = useState(
    product.basePrice !== undefined ? String(product.basePrice) : ''
  );
  const [pctToBase, setPctToBase] = useState(
    product.pctToBase !== undefined ? String(product.pctToBase) : ''
  );
  const [currency, setCurrency] = useState<string | undefined>(
    collateralProductCurrencyCode(product.currency)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currencies = useMemo(() => currencyOptions(template), [template]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(product.name ?? '');
    setQuality(product.quality ?? '');
    setUnitType(product.unitType ?? '');
    setBasePrice(product.basePrice !== undefined ? String(product.basePrice) : '');
    setPctToBase(product.pctToBase !== undefined ? String(product.pctToBase) : '');
    setCurrency(collateralProductCurrencyCode(product.currency));
    setFieldErrors({});
    setSubmitError(null);
  }, [open, product]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateCollateralProductAction(String(product.id), {
        name,
        quality,
        unitType,
        basePrice,
        pctToBase,
        currency: currency ?? ''
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Collateral product updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit collateral product"
      description={product.name ?? 'Update collateral product details.'}
      formId={EDIT_COLLATERAL_PRODUCT_FORM_ID}
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
      <form id={EDIT_COLLATERAL_PRODUCT_FORM_ID} onSubmit={handleSubmit}>
        <CollateralProductFields
          name={name}
          setName={setName}
          quality={quality}
          setQuality={setQuality}
          unitType={unitType}
          setUnitType={setUnitType}
          basePrice={basePrice}
          setBasePrice={setBasePrice}
          pctToBase={pctToBase}
          setPctToBase={setPctToBase}
          currency={currency}
          setCurrency={setCurrency}
          currencies={currencies}
          fieldErrors={fieldErrors}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

function CollateralProductFields({
  name,
  setName,
  quality,
  setQuality,
  unitType,
  setUnitType,
  basePrice,
  setBasePrice,
  pctToBase,
  setPctToBase,
  currency,
  setCurrency,
  currencies,
  fieldErrors,
  disabled = false
}: {
  name: string;
  setName: (value: string) => void;
  quality: string;
  setQuality: (value: string) => void;
  unitType: string;
  setUnitType: (value: string) => void;
  basePrice: string;
  setBasePrice: (value: string) => void;
  pctToBase: string;
  setPctToBase: (value: string) => void;
  currency: string | undefined;
  setCurrency: (value: string | undefined) => void;
  currencies: { value: string; label: string }[];
  fieldErrors: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <TextField
        label="Name"
        required
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        disabled={disabled}
      />
      <TextField
        label="Type/quality"
        required
        value={quality}
        onChange={setQuality}
        error={fieldErrors.quality}
        disabled={disabled}
      />
      <TextField
        label="Unit type"
        required
        value={unitType}
        onChange={setUnitType}
        error={fieldErrors.unitType}
        disabled={disabled}
      />
      <SelectField
        label="Currency"
        required
        value={currency}
        onValueChange={setCurrency}
        options={currencies}
        error={fieldErrors.currency}
        emptyMessage="No currencies available."
        disabled={disabled}
      />
      <MoneyField
        label="Base price"
        required
        value={basePrice}
        onChange={setBasePrice}
        currencyCode={currency}
        error={fieldErrors.basePrice}
        hint={COLLATERAL_PRODUCT_BASE_PRICE_HINT}
        hintAriaLabel="What is base price?"
        disabled={disabled}
      />
      <NumericField
        label="Percentage to base"
        required
        value={pctToBase}
        onChange={setPctToBase}
        error={fieldErrors.pctToBase}
        hint={COLLATERAL_PRODUCT_PCT_TO_BASE_HINT}
        hintAriaLabel="What is percentage to base?"
        disabled={disabled}
      />
    </div>
  );
}
