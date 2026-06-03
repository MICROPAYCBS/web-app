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
import { useState, useTransition } from 'react';
import { AddressFormSheet } from '@/components/clients/shared/address-form-sheet';
import {
  ClientAddressGridCard,
  ClientAddressListItem,
  formatClientAddressSummary
} from '@/components/clients/detail/client-address-sections';
import {
  createClientAddressAction,
  toggleClientAddressActiveAction,
  updateClientAddressAction
} from '@/actions/client-address';
import {
  CollectionViewLayout,
  CollectionViewToggle,
  EmptyState,
  useCollectionViewMode
} from '@/components/composites';
import { Button } from '@/components/ui/button';

const VIEW_MODE_STORAGE_KEY = 'mifos.client-addresses.view-mode';

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
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<FineractClientAddress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { mode, setMode } = useCollectionViewMode(VIEW_MODE_STORAGE_KEY, 'list');

  const wizardTemplate = toWizardTemplate(addressTemplate);
  const showActiveBadge = isFieldEnabled(fieldConfig, 'isActive');
  const showActiveToggle = canUpdate && showActiveBadge;

  function refresh() {
    router.refresh();
  }

  function handleSave(entry: ClientAddressEntry) {
    return (async () => {
      const result = editAddress
        ? await updateClientAddressAction(
            clientId,
            editAddress.addressTypeId,
            editAddress.addressId,
            { ...entry, isActive: editAddress.isActive ?? false }
          )
        : await createClientAddressAction(clientId, entry);

      if (!result.ok) {
        return {
          ok: false as const,
          message: formatActionErrorMessage(result.message, result.fieldErrors)
        };
      }
      setEditAddress(null);
      refresh();
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
      refresh();
    });
  }

  function renderAddress(address: FineractClientAddress) {
    const title = address.addressType ?? 'Address';
    const summary = formatClientAddressSummary(address);
    const common = {
      title,
      subtitle: address.relationship,
      summary,
      isActive: address.isActive,
      showActiveBadge,
      canUpdate,
      onEdit: () => {
        setEditAddress(address);
        setDialogOpen(true);
      },
      onToggleActive: showActiveToggle ? (next: boolean) => handleToggle(address, next) : undefined
    };

    if (mode === 'grid') {
      return <ClientAddressGridCard key={address.addressId} {...common} />;
    }

    return <ClientAddressListItem key={address.addressId} {...common} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Client addresses. Fields shown depend on your institution&apos;s address configuration.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {initialAddresses.length > 0 ? (
            <CollectionViewToggle mode={mode} onModeChange={setMode} disabled={pending} />
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

      {initialAddresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses on file"
          description="Add a mailing or location address for this client."
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
          {initialAddresses.map((address) => renderAddress(address))}
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
        address={editAddress ? toAddressEntry(editAddress) : undefined}
        onSave={handleSave}
        submitLoading={false}
      />
    </div>
  );
}
