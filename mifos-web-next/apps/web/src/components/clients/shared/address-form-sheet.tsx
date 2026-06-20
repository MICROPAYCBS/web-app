'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAddressFieldConfig, FineractClientTemplate } from '@mifos/api-client';
import type { ClientAddressEntry } from '@mifos/validation';
import { useId, useMemo, useState } from 'react';
import { LocationCascadeSelect } from '@/components/clients/shared/location-cascade-select';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import type { FormSubmitResult } from '@/lib/form/submit-result';
import { toSelectOptions } from '@/lib/form/select-options';
import { shouldUseLocationCascade } from '@/lib/locations/location-cascade-config';
import {
  addressFieldsFromLocationSelection,
  EMPTY_LOCATION_SELECTION,
  isLocationSelectionComplete,
  locationSelectionFromAddress,
  type LocationSelection
} from '@/lib/locations/address-location-map';

function isFieldEnabled(config: FineractAddressFieldConfig[], field: string): boolean {
  return config.find((f) => f.field === field)?.isEnabled ?? false;
}

function AddressLineFields({
  fieldConfig,
  form,
  onChange
}: {
  fieldConfig: FineractAddressFieldConfig[];
  form: ClientAddressEntry;
  onChange: (entry: ClientAddressEntry) => void;
}) {
  return (
    <>
      {isFieldEnabled(fieldConfig, 'addressLine1') ? (
        <TextField
          label="Address line 1"
          optional
          value={form.addressLine1 ?? ''}
          onChange={(v) => onChange({ ...form, addressLine1: v })}
        />
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine2') ? (
        <TextField
          label="Address line 2"
          optional
          value={form.addressLine2 ?? ''}
          onChange={(v) => onChange({ ...form, addressLine2: v })}
        />
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine3') ? (
        <TextField
          className="sm:col-span-2"
          label="Address line 3"
          optional
          value={form.addressLine3 ?? ''}
          onChange={(v) => onChange({ ...form, addressLine3: v })}
        />
      ) : null}
    </>
  );
}

export function AddressFormSheet({
  open,
  onOpenChange,
  template,
  fieldConfig,
  address,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractClientTemplate;
  fieldConfig: FineractAddressFieldConfig[];
  address?: ClientAddressEntry;
  onSave: (entry: ClientAddressEntry) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const addressTemplate = template.address?.[0];
  const useLocationCascade = shouldUseLocationCascade(fieldConfig);
  const stateProvinceOptions = addressTemplate?.stateProvinceIdOptions;

  const [form, setForm] = useState<ClientAddressEntry>(() => address ?? { isActive: false });
  const [location, setLocation] = useState<LocationSelection>(() =>
    useLocationCascade
      ? locationSelectionFromAddress(address ?? {}, stateProvinceOptions)
      : EMPTY_LOCATION_SELECTION
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationFields = useMemo(
    () => addressFieldsFromLocationSelection(location, stateProvinceOptions),
    [location, stateProvinceOptions]
  );

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    if (next) {
      setForm(address ?? { isActive: false });
      setLocation(
        useLocationCascade
          ? locationSelectionFromAddress(address ?? {}, stateProvinceOptions)
          : EMPTY_LOCATION_SELECTION
      );
      setError(null);
    }
    onOpenChange(next);
  }

  function handleLocationChange(next: LocationSelection) {
    setLocation(next);
    const geo = addressFieldsFromLocationSelection(next, stateProvinceOptions);
    setForm((current) => ({
      ...current,
      stateProvinceId: geo.stateProvinceId,
      city: geo.city,
      countyDistrict: geo.countyDistrict,
      townVillage: geo.townVillage,
      addressLine1: geo.addressLine1 ?? '',
      addressLine2: geo.addressLine2 ?? ''
    }));
  }

  async function handleSave() {
    if (isSubmitting) {
      return;
    }
    if (isFieldEnabled(fieldConfig, 'addressType') && !form.addressTypeId) {
      setError('Address type is required.');
      return;
    }
    if (useLocationCascade && !isLocationSelectionComplete(location)) {
      setError('Please select region, district, county, sub-county, parish, and village.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const entry: ClientAddressEntry = useLocationCascade
        ? {
            ...form,
            ...locationFields,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            addressLine3: form.addressLine3,
            isActive: form.isActive ?? false
          }
        : { ...form, isActive: form.isActive ?? false };

      const result = await onSave(entry);
      if (result.ok) {
        handleOpenChange(false);
        return;
      }
      setError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={address ? 'Edit address' : 'Add address'}
      description={
        useLocationCascade
          ? 'Select the customer location from the administrative hierarchy.'
          : "Fields shown depend on your institution's address configuration."
      }
      formId={formId}
      submitLabel="Save"
      onSubmit={handleSave}
      submitLoading={isSubmitting || submitLoading}
      className="data-[side=right]:sm:max-w-2xl"
    >
      <form
        id={formId}
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
        {isFieldEnabled(fieldConfig, 'addressType') ? (
          <SelectField
            label="Address type"
            required
            value={form.addressTypeId ? String(form.addressTypeId) : undefined}
            onValueChange={(v) => setForm({ ...form, addressTypeId: Number(v) })}
            options={toSelectOptions(addressTemplate?.addressTypeIdOptions)}
          />
        ) : null}
        {isFieldEnabled(fieldConfig, 'countryId') ? (
          <SelectField
            label="Country"
            optional
            value={form.countryId ? String(form.countryId) : undefined}
            onValueChange={(v) => setForm({ ...form, countryId: v ? Number(v) : undefined })}
            options={toSelectOptions(addressTemplate?.countryIdOptions)}
          />
        ) : null}
        {useLocationCascade ? (
          <>
            <LocationCascadeSelect
              value={location}
              onChange={handleLocationChange}
              disabled={isSubmitting || submitLoading}
            />
            {isFieldEnabled(fieldConfig, 'street') ? (
              <TextField
                className="sm:col-span-2"
                label="Street"
                optional
                value={form.street ?? ''}
                onChange={(v) => setForm({ ...form, street: v })}
              />
            ) : null}
            <AddressLineFields fieldConfig={fieldConfig} form={form} onChange={setForm} />
            {isFieldEnabled(fieldConfig, 'postalCode') ? (
              <TextField
                label="Postal code"
                optional
                value={form.postalCode ?? ''}
                onChange={(v) => setForm({ ...form, postalCode: v })}
              />
            ) : null}
          </>
        ) : (
          <>
            {isFieldEnabled(fieldConfig, 'street') ? (
              <TextField
                className="sm:col-span-2"
                label="Street"
                optional
                value={form.street ?? ''}
                onChange={(v) => setForm({ ...form, street: v })}
              />
            ) : null}
            <AddressLineFields fieldConfig={fieldConfig} form={form} onChange={setForm} />
            {isFieldEnabled(fieldConfig, 'townVillage') ? (
              <TextField
                label="Town / village"
                optional
                value={form.townVillage ?? ''}
                onChange={(v) => setForm({ ...form, townVillage: v })}
              />
            ) : null}
            {isFieldEnabled(fieldConfig, 'city') ? (
              <TextField
                label="City"
                optional
                value={form.city ?? ''}
                onChange={(v) => setForm({ ...form, city: v })}
              />
            ) : null}
            {isFieldEnabled(fieldConfig, 'stateProvinceId') ? (
              <SelectField
                label="State / province"
                optional
                value={form.stateProvinceId ? String(form.stateProvinceId) : undefined}
                onValueChange={(v) =>
                  setForm({ ...form, stateProvinceId: v ? Number(v) : undefined })
                }
                options={toSelectOptions(stateProvinceOptions)}
              />
            ) : null}
            {isFieldEnabled(fieldConfig, 'postalCode') ? (
              <TextField
                label="Postal code"
                optional
                value={form.postalCode ?? ''}
                onChange={(v) => setForm({ ...form, postalCode: v })}
              />
            ) : null}
            {isFieldEnabled(fieldConfig, 'countyDistrict') ? (
              <TextField
                label="County district"
                optional
                value={form.countyDistrict ?? ''}
                onChange={(v) => setForm({ ...form, countyDistrict: v })}
              />
            ) : null}
          </>
        )}
      </form>
    </FormSheet>
  );
}
