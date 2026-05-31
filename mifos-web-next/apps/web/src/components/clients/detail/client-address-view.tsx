'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAddressFieldConfig,
  FineractClientAddress,
  FineractClientAddressTemplate,
  FineractClientTemplate
} from '@mifos/api-client';
import type { ClientAddressEntry } from '@mifos/validation';
import { MapPin, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AddressFormSheet } from '@/components/clients/shared/address-form-sheet';
import { ClientAddressPanel } from '@/components/clients/detail/client-address-sections';
import {
  createClientAddressAction,
  toggleClientAddressActiveAction,
  updateClientAddressAction
} from '@/actions/client-address';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';

function toWizardTemplate(template: FineractClientAddressTemplate): FineractClientTemplate {
  return {
    officeOptions: [],
    address: [template]
  };
}

function toAddressEntry(address: FineractClientAddress): ClientAddressEntry {
  return {
    addressTypeId: address.addressTypeId,
    street: address.street,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    addressLine3: address.addressLine3,
    townVillage: address.townVillage,
    city: address.city,
    stateProvinceId: address.stateProvinceId,
    countryId: address.countryId,
    countyDistrict: address.countyDistrict,
    postalCode: address.postalCode,
    isActive: address.isActive ?? false
  };
}

export function ClientAddressView({
  clientId,
  addresses: initialAddresses,
  fieldConfig,
  addressTemplate,
  canUpdate
}: {
  clientId: string;
  addresses: FineractClientAddress[];
  fieldConfig: FineractAddressFieldConfig[];
  addressTemplate: FineractClientAddressTemplate;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<FineractClientAddress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const wizardTemplate = toWizardTemplate(addressTemplate);

  function refresh() {
    router.refresh();
  }

  function handleSave(entry: ClientAddressEntry) {
    setActionError(null);
    startTransition(async () => {
      const result = editAddress
        ? await updateClientAddressAction(
            clientId,
            editAddress.addressTypeId,
            editAddress.addressId,
            { ...entry, isActive: editAddress.isActive ?? false }
          )
        : await createClientAddressAction(clientId, entry);

      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDialogOpen(false);
      setEditAddress(null);
      refresh();
    });
  }

  function handleToggle(address: FineractClientAddress, isActive: boolean) {
    setActionError(null);
    startTransition(async () => {
      const result = await toggleClientAddressActiveAction(
        clientId,
        address.addressTypeId,
        address.addressId,
        isActive
      );
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Client addresses from Fineract. Fields shown depend on institution address configuration.
        </p>
        {canUpdate ? (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => {
              setEditAddress(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Add address
          </Button>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {initialAddresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses on file"
          description="Add a client address to store mailing or location details in Fineract."
          action={
            canUpdate ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setEditAddress(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Add address
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {initialAddresses.map((address) => (
            <ClientAddressPanel
              key={address.addressId}
              address={address}
              fieldConfig={fieldConfig}
              template={addressTemplate}
              canUpdate={canUpdate}
              onEdit={() => {
                setEditAddress(address);
                setDialogOpen(true);
              }}
              onToggleActive={(next) => handleToggle(address, next)}
            />
          ))}
        </div>
      )}

      <AddressFormSheet
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditAddress(null);
          }
        }}
        template={wizardTemplate}
        fieldConfig={fieldConfig}
        address={editAddress ? toAddressEntry(editAddress) : undefined}
        onSave={handleSave}
        submitLoading={pending}
      />
    </div>
  );
}
