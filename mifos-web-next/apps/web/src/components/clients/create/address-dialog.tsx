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
import { useState } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toSelectOptions } from '@/lib/form/select-options';

function isFieldEnabled(config: FineractAddressFieldConfig[], field: string): boolean {
  return config.find((f) => f.field === field)?.isEnabled ?? false;
}

export function AddressDialog({
  open,
  onOpenChange,
  template,
  fieldConfig,
  address,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractClientTemplate;
  fieldConfig: FineractAddressFieldConfig[];
  address?: ClientAddressEntry;
  onSave: (entry: ClientAddressEntry) => void;
}) {
  const addressTemplate = template.address?.[0];
  const [form, setForm] = useState<ClientAddressEntry>(() => address ?? { isActive: false });
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setForm(address ?? { isActive: false });
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSave() {
    if (isFieldEnabled(fieldConfig, 'addressType') && !form.addressTypeId) {
      setError('Address type is required.');
      return;
    }
    if (isFieldEnabled(fieldConfig, 'street') && !form.street?.trim()) {
      setError('Street is required.');
      return;
    }
    setError(null);
    onSave({ ...form, isActive: form.isActive ?? false });
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit address' : 'Add address'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
          {isFieldEnabled(fieldConfig, 'addressType') ? (
            <SelectField
              className="sm:col-span-2"
              label="Address type"
              required
              value={form.addressTypeId ? String(form.addressTypeId) : undefined}
              onValueChange={(v) => setForm({ ...form, addressTypeId: Number(v) })}
              options={toSelectOptions(addressTemplate?.addressTypeIdOptions)}
            />
          ) : null}
          {isFieldEnabled(fieldConfig, 'street') ? (
            <TextField
              className="sm:col-span-2"
              label="Street"
              required
              value={form.street ?? ''}
              onChange={(v) => setForm({ ...form, street: v })}
            />
          ) : null}
          {isFieldEnabled(fieldConfig, 'addressLine1') ? (
            <TextField
              label="Address line 1"
              optional
              value={form.addressLine1 ?? ''}
              onChange={(v) => setForm({ ...form, addressLine1: v })}
            />
          ) : null}
          {isFieldEnabled(fieldConfig, 'addressLine2') ? (
            <TextField
              label="Address line 2"
              optional
              value={form.addressLine2 ?? ''}
              onChange={(v) => setForm({ ...form, addressLine2: v })}
            />
          ) : null}
          {isFieldEnabled(fieldConfig, 'addressLine3') ? (
            <TextField
              label="Address line 3"
              optional
              value={form.addressLine3 ?? ''}
              onChange={(v) => setForm({ ...form, addressLine3: v })}
            />
          ) : null}
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
              options={toSelectOptions(addressTemplate?.stateProvinceIdOptions)}
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
