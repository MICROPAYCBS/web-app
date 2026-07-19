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
import { applyClientAddressActiveChange, mergeClientAddressEntry, setClientAddressPrimary } from '@mifos/validation';
import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { AddressFormSheet } from '@/components/clients/shared/address-form-sheet';
import {
  ClientAddressGridCard,
  ClientAddressListItem,
  formatClientAddressEntrySummary
} from '@/components/clients/detail/client-address-sections';
import { DraftCollectionView } from '@/components/clients/shared/draft-collection-view';
import type { CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';

const VIEW_MODE_STORAGE_KEY = 'mifos.create-client.addresses.view-mode';

function addressTypeLabel(template: FineractClientTemplate, addressTypeId: number): string {
  const option = template.address
    ?.flatMap((block) => block.addressTypeIdOptions ?? [])
    .find((o) => o.id === addressTypeId);
  return option?.name ?? option?.value ?? `Address type ${addressTypeId}`;
}

export function AddressStep({
  template,
  fieldConfig,
  draft,
  errors,
  onAddressesChange
}: {
  template: FineractClientTemplate;
  fieldConfig: FineractAddressFieldConfig[];
  draft: CreateClientDraft;
  errors: StepErrors;
  onAddressesChange: (addresses: ClientAddressEntry[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const addresses = draft.addresses;
  const showActiveBadge = fieldConfig.some((f) => f.field === 'isActive' && f.isEnabled);
  const showActiveToggle = showActiveBadge;

  function openEdit(index: number) {
    setEditIndex(index);
    setDialogOpen(true);
  }

  function remove(index: number) {
    let next = addresses.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((entry) => entry.isPrimary)) {
      const activeIndex = next.findIndex((entry) => entry.isActive !== false);
      if (activeIndex >= 0) {
        next = setClientAddressPrimary(next, activeIndex);
      }
    }
    onAddressesChange(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add one or more addresses for this customer. Mark one as primary; at least one address is required on this step.
      </p>
      {errors.address ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.address}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setEditIndex(null);
          setDialogOpen(true);
        }}
      >
        <Plus className="mr-2 size-4" />
        Add address
      </Button>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses added yet"
          description="Add at least one address to continue. Required fields depend on your institution configuration."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditIndex(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add address
            </Button>
          }
        />
      ) : (
        <DraftCollectionView
          storageKey={VIEW_MODE_STORAGE_KEY}
          itemCount={addresses.length}
          renderItems={(mode) =>
            addresses.map((addr, index) => {
              const title = addressTypeLabel(template, addr.addressTypeId ?? 0);
              const summary = formatClientAddressEntrySummary(addr, {
                fieldConfig,
                stateProvinceOptions: template.address?.[0]?.stateProvinceIdOptions
              });
              const onEdit = () => openEdit(index);
              const onDelete = () => remove(index);
              const onToggleActive = showActiveToggle
                ? (isActive: boolean) => {
                    onAddressesChange(applyClientAddressActiveChange(addresses, index, isActive));
                  }
                : undefined;
              const onTogglePrimary =
                addr.isActive !== false
                  ? () => {
                      onAddressesChange(setClientAddressPrimary(addresses, index));
                    }
                  : undefined;

              if (mode === 'grid') {
                return (
                  <ClientAddressGridCard
                    key={index}
                    title={title}
                    summary={summary}
                    isActive={addr.isActive}
                    showActiveBadge={showActiveBadge}
                    isPrimary={addr.isPrimary}
                    showPrimaryBadge
                    canUpdate
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                    onTogglePrimary={onTogglePrimary}
                  />
                );
              }

              return (
                <ClientAddressListItem
                  key={index}
                  title={title}
                  summary={summary}
                  isActive={addr.isActive}
                  showActiveBadge={showActiveBadge}
                  isPrimary={addr.isPrimary}
                  showPrimaryBadge
                  canUpdate
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleActive={onToggleActive}
                  onTogglePrimary={onTogglePrimary}
                />
              );
            })
          }
        />
      )}

      <AddressFormSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={template}
        fieldConfig={fieldConfig}
        existingAddressCount={editIndex != null ? addresses.length - 1 : addresses.length}
        address={editIndex != null ? addresses[editIndex] : undefined}
        onSave={async (entry) => {
          onAddressesChange(mergeClientAddressEntry(addresses, entry, editIndex));
          return { ok: true as const };
        }}
      />
    </div>
  );
}
