'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAddressFieldConfig, FineractClientTemplate } from '@mifos/api-client';
import {
  CLIENT_ADDRESS_POSTAL_CODE_MAX_LENGTH,
  CLIENT_ADDRESS_TEXT_MAX_LENGTH,
  clientAddressEntrySchema,
  type ClientAddressEntry
} from '@mifos/validation';
import { LocateFixed } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { LocationCascadeSelect } from '@/components/clients/shared/location-cascade-select';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { addressFieldConfigurationLabel } from '@/lib/fineract/address-field-configuration-display';
import type { FormSubmitResult } from '@/lib/form/submit-result';
import { toSelectOptions } from '@/lib/form/select-options';
import { readCurrentGpsPosition } from '@/lib/geolocation/coordinates';
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

function parseCoordinateInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function coordinateFieldValue(value: number | undefined): string {
  return value == null ? '' : String(value);
}

function CoordinateFields({
  open,
  fieldConfig,
  form,
  onChange,
  disabled
}: {
  open: boolean;
  fieldConfig: FineractAddressFieldConfig[];
  form: ClientAddressEntry;
  onChange: (entry: ClientAddressEntry) => void;
  disabled?: boolean;
}) {
  const showLatitude = isFieldEnabled(fieldConfig, 'latitude');
  const showLongitude = isFieldEnabled(fieldConfig, 'longitude');
  const [detecting, setDetecting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setGpsError(null);
      setDetecting(false);
    }
  }, [open]);

  if (!showLatitude && !showLongitude) {
    return null;
  }

  async function handleUseCurrentLocation() {
    if (disabled || detecting) {
      return;
    }

    setGpsError(null);
    setDetecting(true);
    try {
      const position = await readCurrentGpsPosition();
      onChange({
        ...form,
        ...(showLatitude ? { latitude: position.latitude } : {}),
        ...(showLongitude ? { longitude: position.longitude } : {})
      });
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'Could not read your location.');
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">GPS coordinates</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleUseCurrentLocation()}
          disabled={disabled || detecting}
        >
          <LocateFixed className="mr-2 size-4" aria-hidden />
          {detecting ? 'Detecting location…' : 'Use my location'}
        </Button>
      </div>
      {gpsError ? <p className="text-sm text-destructive">{gpsError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {showLatitude ? (
          <NumericField
            label="Latitude"
            optional
            allowNegative
            maxDecimalPlaces={8}
            value={coordinateFieldValue(form.latitude)}
            onChange={(value) => onChange({ ...form, latitude: parseCoordinateInput(value) })}
            disabled={disabled || detecting}
            placeholder="e.g. 0.347596"
          />
        ) : null}
        {showLongitude ? (
          <NumericField
            label="Longitude"
            optional
            allowNegative
            maxDecimalPlaces={8}
            value={coordinateFieldValue(form.longitude)}
            onChange={(value) => onChange({ ...form, longitude: parseCoordinateInput(value) })}
            disabled={disabled || detecting}
            placeholder="e.g. 32.582520"
          />
        ) : null}
      </div>
    </div>
  );
}

function buildAddressFormState(
  address: ClientAddressEntry | undefined,
  existingAddressCount: number
): ClientAddressEntry {
  return {
    ...address,
    isActive: address?.isActive ?? true,
    isPrimary: address?.isPrimary ?? (!address && existingAddressCount === 0)
  };
}

function characterCountHint(value: string | undefined, max: number): string {
  const length = (value ?? '').trim().length;
  return `${length} / ${max}`;
}

function AddressLineFields({
  fieldConfig,
  form,
  onChange,
  /** When cascade owns Sub-county/Parish, only show optional address line 3. */
  cascadeMode = false
}: {
  fieldConfig: FineractAddressFieldConfig[];
  form: ClientAddressEntry;
  onChange: (entry: ClientAddressEntry) => void;
  cascadeMode?: boolean;
}) {
  return (
    <>
      {!cascadeMode && isFieldEnabled(fieldConfig, 'addressLine1') ? (
        <TextField
          label={addressFieldConfigurationLabel('addressLine1')}
          optional
          value={form.addressLine1 ?? ''}
          onChange={(v) => onChange({ ...form, addressLine1: v })}
          maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
          hint={characterCountHint(form.addressLine1, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
        />
      ) : null}
      {!cascadeMode && isFieldEnabled(fieldConfig, 'addressLine2') ? (
        <TextField
          label={addressFieldConfigurationLabel('addressLine2')}
          optional
          value={form.addressLine2 ?? ''}
          onChange={(v) => onChange({ ...form, addressLine2: v })}
          maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
          hint={characterCountHint(form.addressLine2, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
        />
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine3') ? (
        <TextField
          className="sm:col-span-2"
          label={addressFieldConfigurationLabel('addressLine3')}
          optional
          value={form.addressLine3 ?? ''}
          onChange={(v) => onChange({ ...form, addressLine3: v })}
          maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
          hint={characterCountHint(form.addressLine3, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
        />
      ) : null}
    </>
  );
}

function PostalCodeField({
  form,
  onChange
}: {
  form: ClientAddressEntry;
  onChange: (entry: ClientAddressEntry) => void;
}) {
  return (
    <TextField
      label="Postal code"
      optional
      value={form.postalCode ?? ''}
      onChange={(v) => onChange({ ...form, postalCode: v })}
      maxLength={CLIENT_ADDRESS_POSTAL_CODE_MAX_LENGTH}
      hint={`Optional. Postal/ZIP only — not region or district names. ${characterCountHint(form.postalCode, CLIENT_ADDRESS_POSTAL_CODE_MAX_LENGTH)}`}
    />
  );
}

export function AddressFormSheet({
  open,
  onOpenChange,
  template,
  fieldConfig,
  address,
  existingAddressCount = 0,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractClientTemplate;
  fieldConfig: FineractAddressFieldConfig[];
  address?: ClientAddressEntry;
  existingAddressCount?: number;
  onSave: (entry: ClientAddressEntry) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const addressTemplate = template.address?.[0];
  const useLocationCascade = shouldUseLocationCascade(fieldConfig);
  const stateProvinceOptions = addressTemplate?.stateProvinceIdOptions;

  const [form, setForm] = useState<ClientAddressEntry>(() =>
    buildAddressFormState(address, existingAddressCount)
  );
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

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(buildAddressFormState(address, existingAddressCount));
    setLocation(
      useLocationCascade
        ? locationSelectionFromAddress(address ?? {}, stateProvinceOptions)
        : EMPTY_LOCATION_SELECTION
    );
    setError(null);
  }, [open, address, existingAddressCount, useLocationCascade, stateProvinceOptions]);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
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
    if ((form.isPrimary ?? false) && form.isActive === false) {
      setError('An inactive address cannot be marked as primary.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const entry: ClientAddressEntry = useLocationCascade
        ? {
            ...form,
            ...locationFields,
            // Cascade owns Sub-county / Parish; keep optional line 3 and street from the form.
            addressLine3: form.addressLine3?.trim() || undefined,
            street: form.street?.trim() || undefined,
            postalCode: form.postalCode?.trim() || undefined,
            isActive: form.isActive ?? true,
            isPrimary: form.isPrimary ?? false
          }
        : {
            ...form,
            street: form.street?.trim() || undefined,
            addressLine1: form.addressLine1?.trim() || undefined,
            addressLine2: form.addressLine2?.trim() || undefined,
            addressLine3: form.addressLine3?.trim() || undefined,
            townVillage: form.townVillage?.trim() || undefined,
            city: form.city?.trim() || undefined,
            countyDistrict: form.countyDistrict?.trim() || undefined,
            postalCode: form.postalCode?.trim() || undefined,
            isActive: form.isActive ?? true,
            isPrimary: form.isPrimary ?? false
          };

      const parsed = clientAddressEntrySchema.safeParse(entry);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Fix the highlighted address fields.');
        return;
      }

      const result = await onSave(parsed.data);
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
                label={addressFieldConfigurationLabel('street')}
                optional
                value={form.street ?? ''}
                onChange={(v) => setForm({ ...form, street: v })}
                maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
                hint={characterCountHint(form.street, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
              />
            ) : null}
            <AddressLineFields
              fieldConfig={fieldConfig}
              form={form}
              onChange={setForm}
              cascadeMode
            />
            {isFieldEnabled(fieldConfig, 'postalCode') ? (
              <PostalCodeField form={form} onChange={setForm} />
            ) : null}
            <CoordinateFields
              open={open}
              fieldConfig={fieldConfig}
              form={form}
              onChange={setForm}
              disabled={isSubmitting || submitLoading}
            />
          </>
        ) : (
          <>
            {isFieldEnabled(fieldConfig, 'street') ? (
              <TextField
                className="sm:col-span-2"
                label={addressFieldConfigurationLabel('street')}
                optional
                value={form.street ?? ''}
                onChange={(v) => setForm({ ...form, street: v })}
                maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
                hint={characterCountHint(form.street, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
              />
            ) : null}
            <AddressLineFields fieldConfig={fieldConfig} form={form} onChange={setForm} />
            {isFieldEnabled(fieldConfig, 'townVillage') ? (
              <TextField
                label={addressFieldConfigurationLabel('townVillage')}
                optional
                value={form.townVillage ?? ''}
                onChange={(v) => setForm({ ...form, townVillage: v })}
                maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
                hint={characterCountHint(form.townVillage, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
              />
            ) : null}
            {isFieldEnabled(fieldConfig, 'city') ? (
              <TextField
                label={addressFieldConfigurationLabel('city')}
                optional
                value={form.city ?? ''}
                onChange={(v) => setForm({ ...form, city: v })}
                maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
                hint={characterCountHint(form.city, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
              />
            ) : null}
            {isFieldEnabled(fieldConfig, 'stateProvinceId') ? (
              <SelectField
                label={addressFieldConfigurationLabel('stateProvinceId')}
                optional
                value={form.stateProvinceId ? String(form.stateProvinceId) : undefined}
                onValueChange={(v) =>
                  setForm({ ...form, stateProvinceId: v ? Number(v) : undefined })
                }
                options={toSelectOptions(stateProvinceOptions)}
              />
            ) : null}
            {isFieldEnabled(fieldConfig, 'postalCode') ? (
              <PostalCodeField form={form} onChange={setForm} />
            ) : null}
            {isFieldEnabled(fieldConfig, 'countyDistrict') ? (
              <TextField
                label={addressFieldConfigurationLabel('countyDistrict')}
                optional
                value={form.countyDistrict ?? ''}
                onChange={(v) => setForm({ ...form, countyDistrict: v })}
                maxLength={CLIENT_ADDRESS_TEXT_MAX_LENGTH}
                hint={characterCountHint(form.countyDistrict, CLIENT_ADDRESS_TEXT_MAX_LENGTH)}
              />
            ) : null}
            <CoordinateFields
              open={open}
              fieldConfig={fieldConfig}
              form={form}
              onChange={setForm}
              disabled={isSubmitting || submitLoading}
            />
          </>
        )}
        {form.isActive !== false ? (
          <SwitchField
            id={`${formId}-isPrimary`}
            className="sm:col-span-2"
            label="Primary address"
            description="The customer's main contact address. Only one address can be primary."
            checked={form.isPrimary ?? false}
            onCheckedChange={(checked) => setForm({ ...form, isPrimary: checked })}
          />
        ) : null}
      </form>
    </FormSheet>
  );
}
