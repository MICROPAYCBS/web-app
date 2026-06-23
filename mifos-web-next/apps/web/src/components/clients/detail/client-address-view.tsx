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
import { formatActionErrorMessage, type ClientAddressEntry } from '@mifos/validation';
import { MapPin, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { AddressFormSheet } from '@/components/clients/shared/address-form-sheet';
import {
  ClientAddressGridCard,
  ClientAddressListItem,
  ClientAddressSections,
  formatClientAddressSummary
} from '@/components/clients/detail/client-address-sections';
import { formatLocationAddressSummary } from '@/lib/locations/address-location-map';
import { shouldUseLocationCascade } from '@/lib/locations/location-cascade-config';
import {
  createClientAddressAction,
  toggleClientAddressActiveAction,
  toggleClientAddressPrimaryAction,
  updateClientAddressAction,
  type ClientAddressActionResult
} from '@/actions/client-address';
import {
  CollectionViewLayout,
  CollectionViewToolbar,
  EmptyState,
  useCollectionDetailMode,
  useCollectionViewMode
} from '@/components/composites';
import { Button } from '@/components/ui/button';

const VIEW_MODE_STORAGE_KEY = 'mifos.client-addresses.view-mode';
const DETAIL_MODE_STORAGE_KEY = 'mifos.client-addresses.detail-mode';

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
    isActive: address.isActive ?? true,
    isPrimary: address.isPrimary ?? false
  };
}

function isFieldEnabled(config: FineractAddressFieldConfig[], field: string): boolean {
  return config.find((f) => f.field === field)?.isEnabled ?? false;
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
  const [addresses, setAddresses] = useState(initialAddresses);
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<FineractClientAddress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { mode, setMode } = useCollectionViewMode(VIEW_MODE_STORAGE_KEY, 'list');
  const { mode: detailMode, setMode: setDetailMode } = useCollectionDetailMode(
    DETAIL_MODE_STORAGE_KEY,
    'summary'
  );

  const wizardTemplate = toWizardTemplate(addressTemplate);
  const showActiveBadge = isFieldEnabled(fieldConfig, 'isActive');
  const showActiveToggle = canUpdate && showActiveBadge;
  const showPrimaryBadge = true;
  const showPrimaryToggle = canUpdate;

  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  function refresh() {
    router.refresh();
  }

  function applyActionResult(result: ClientAddressActionResult) {
    if (result.ok) {
      setAddresses(result.addresses);
      refresh();
    }
  }

  function handleSave(entry: ClientAddressEntry) {
    return (async () => {
      const result = editAddress
        ? await updateClientAddressAction(
            clientId,
            editAddress.addressTypeId,
            editAddress.addressId,
            entry
          )
        : await createClientAddressAction(clientId, entry);

      if (!result.ok) {
        return {
          ok: false as const,
          message: formatActionErrorMessage(result.message, result.fieldErrors)
        };
      }
      setEditAddress(null);
      applyActionResult(result);
      return { ok: true as const };
    })();
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
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      applyActionResult(result);
    });
  }

  function handleTogglePrimary(address: FineractClientAddress) {
    if (address.isPrimary || address.isActive === false) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await toggleClientAddressPrimaryAction(
        clientId,
        address.addressTypeId,
        address.addressId,
        true
      );
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      applyActionResult(result);
    });
  }

  function renderAddress(address: FineractClientAddress) {
    const title = address.addressType ?? 'Address';
    const summary = shouldUseLocationCascade(fieldConfig)
      ? formatLocationAddressSummary(address, addressTemplate.stateProvinceIdOptions)
      : formatClientAddressSummary(address);
    const common = {
      title,
      subtitle: address.relationship,
      summary,
      detailMode,
      details: (
        <ClientAddressSections
          address={address}
          fieldConfig={fieldConfig}
          template={addressTemplate}
        />
      ),
      isActive: address.isActive,
      showActiveBadge,
      isPrimary: address.isPrimary,
      showPrimaryBadge,
      canUpdate,
      onEdit: () => {
        setEditAddress(address);
        setDialogOpen(true);
      },
      onToggleActive: showActiveToggle ? (next: boolean) => handleToggle(address, next) : undefined,
      onTogglePrimary:
        showPrimaryToggle && address.isActive !== false
          ? () => handleTogglePrimary(address)
          : undefined
    };

    if (mode === 'grid') {
      return <ClientAddressGridCard key={address.clientAddressId ?? address.addressId} {...common} />;
    }

    return <ClientAddressListItem key={address.clientAddressId ?? address.addressId} {...common} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Customer addresses. Fields shown depend on your institution&apos;s address configuration.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {addresses.length > 0 ? (
            <CollectionViewToolbar
              mode={mode}
              onModeChange={setMode}
              detailMode={detailMode}
              onDetailModeChange={setDetailMode}
              disabled={pending}
            />
          ) : null}
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
      </div>

      {actionError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses on file"
          description="Add a mailing or location address for this customer."
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
        <CollectionViewLayout mode={mode}>
          {addresses.map((address) => renderAddress(address))}
        </CollectionViewLayout>
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
        existingAddressCount={editAddress ? addresses.length - 1 : addresses.length}
        address={editAddress ? toAddressEntry(editAddress) : undefined}
        onSave={handleSave}
        submitLoading={false}
      />
    </div>
  );
}
