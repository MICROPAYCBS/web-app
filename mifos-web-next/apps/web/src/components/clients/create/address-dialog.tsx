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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit address' : 'Add address'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
          {isFieldEnabled(fieldConfig, 'addressType') ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Address type</Label>
              <Select
                value={form.addressTypeId ? String(form.addressTypeId) : ''}
                onValueChange={(v) => setForm({ ...form, addressTypeId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {addressTemplate?.addressTypeIdOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'street') ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Street</Label>
              <Input
                value={form.street ?? ''}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'addressLine1') ? (
            <div className="space-y-2">
              <Label>Address line 1</Label>
              <Input
                value={form.addressLine1 ?? ''}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'addressLine2') ? (
            <div className="space-y-2">
              <Label>Address line 2</Label>
              <Input
                value={form.addressLine2 ?? ''}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              />
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'addressLine3') ? (
            <div className="space-y-2">
              <Label>Address line 3</Label>
              <Input
                value={form.addressLine3 ?? ''}
                onChange={(e) => setForm({ ...form, addressLine3: e.target.value })}
              />
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'townVillage') ? (
            <div className="space-y-2">
              <Label>Town / village</Label>
              <Input
                value={form.townVillage ?? ''}
                onChange={(e) => setForm({ ...form, townVillage: e.target.value })}
              />
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'city') ? (
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city ?? ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'stateProvinceId') ? (
            <div className="space-y-2">
              <Label>State / province</Label>
              <Select
                value={form.stateProvinceId ? String(form.stateProvinceId) : ''}
                onValueChange={(v) =>
                  setForm({ ...form, stateProvinceId: v ? Number(v) : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {addressTemplate?.stateProvinceIdOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'countryId') ? (
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={form.countryId ? String(form.countryId) : ''}
                onValueChange={(v) => setForm({ ...form, countryId: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {addressTemplate?.countryIdOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'postalCode') ? (
            <div className="space-y-2">
              <Label>Postal code</Label>
              <Input
                value={form.postalCode ?? ''}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>
          ) : null}
          {isFieldEnabled(fieldConfig, 'countyDistrict') ? (
            <div className="space-y-2">
              <Label>County district</Label>
              <Input
                value={form.countyDistrict ?? ''}
                onChange={(e) => setForm({ ...form, countyDistrict: e.target.value })}
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
