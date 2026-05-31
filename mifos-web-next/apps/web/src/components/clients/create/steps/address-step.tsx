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
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddressDialog } from '../address-dialog';
import type { CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add one or more addresses for this client. At least one address is required on this step.
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
        <ul className="divide-y rounded-md border">
          {addresses.map((addr, index) => (
            <li key={index} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                {[addr.street, addr.city, addr.postalCode].filter(Boolean).join(', ') ||
                  `Address ${index + 1}`}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditIndex(index);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddressesChange(addresses.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={template}
        fieldConfig={fieldConfig}
        address={editIndex != null ? addresses[editIndex] : undefined}
        onSave={(entry) => {
          if (editIndex != null) {
            const next = [...addresses];
            next[editIndex] = entry;
            onAddressesChange(next);
          } else {
            onAddressesChange([...addresses, entry]);
          }
        }}
      />
    </div>
  );
}
