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
  FineractEnumOption
} from '@mifos/api-client';
import type { ClientAddressEntry } from '@mifos/validation';
import type { ReactNode } from 'react';
import type { CollectionDetailMode } from '@/components/composites';
import { CollectionItemFieldDetails, DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import {
  formatLocationAddressSummary
} from '@/lib/locations/address-location-map';
import { shouldUseLocationCascade } from '@/lib/locations/location-cascade-config';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SwitchField } from '@/components/composites/switch-field';

function isFieldEnabled(config: FineractAddressFieldConfig[], field: string): boolean {
  return config.find((f) => f.field === field)?.isEnabled ?? false;
}

function optionLabel(options: FineractEnumOption[] | undefined, id?: number): string | undefined {
  if (id == null || !options?.length) {
    return undefined;
  }
  return options.find((o) => o.id === id)?.name ?? options.find((o) => o.id === id)?.value;
}

type AddressSummaryParts = {
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townVillage?: string;
  city?: string;
  postalCode?: string;
  countyDistrict?: string;
};

export function formatAddressSummary(parts: AddressSummaryParts): string {
  const line = [
    parts.street,
    parts.addressLine1,
    parts.addressLine2,
    parts.addressLine3,
    parts.townVillage,
    parts.city,
    parts.countyDistrict,
    parts.postalCode
  ]
    .filter(Boolean)
    .join(', ');
  return line || 'No address details on file';
}

export function formatClientAddressSummary(address: FineractClientAddress): string {
  return formatAddressSummary(address);
}

export function formatClientAddressEntrySummary(
  entry: ClientAddressEntry,
  options?: { fieldConfig?: FineractAddressFieldConfig[]; stateProvinceOptions?: FineractEnumOption[] }
): string {
  if (options?.fieldConfig && shouldUseLocationCascade(options.fieldConfig)) {
    return formatLocationAddressSummary(entry, options.stateProvinceOptions);
  }
  return formatAddressSummary(entry);
}

function AddressCollectionActions({
  canUpdate,
  onEdit,
  onDelete,
  className
}: {
  canUpdate: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  className?: string;
}) {
  if (!canUpdate) {
    return null;
  }
  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      <button
        type="button"
        className="text-sm font-medium text-primary hover:underline"
        onClick={onEdit}
      >
        Edit
      </button>
      {onDelete ? (
        <button
          type="button"
          className="text-sm font-medium text-destructive hover:underline"
          onClick={onDelete}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

export function ClientAddressListItem({
  title,
  subtitle,
  summary,
  detailMode,
  details,
  isActive,
  showActiveBadge,
  isPrimary,
  showPrimaryBadge,
  canUpdate,
  onEdit,
  onDelete,
  onToggleActive,
  onTogglePrimary,
  className
}: {
  title: string;
  subtitle?: string;
  summary: string;
  detailMode?: CollectionDetailMode;
  details?: ReactNode;
  isActive?: boolean;
  showActiveBadge?: boolean;
  isPrimary?: boolean;
  showPrimaryBadge?: boolean;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onToggleActive?: (next: boolean) => void;
  onTogglePrimary?: () => void;
  className?: string;
}) {
  const body =
    detailMode && details ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        {details}
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 bg-card px-4 py-3 sm:flex-row sm:items-start',
        isPrimary && 'bg-primary/5 ring-1 ring-inset ring-primary/10',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{title}</p>
          {showActiveBadge ? (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          ) : null}
          {showPrimaryBadge && isPrimary ? (
            <Badge variant="outline">Primary</Badge>
          ) : null}
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        {body}
        {canUpdate && onToggleActive ? (
          <div className="pt-1 sm:hidden">
            <SwitchField
              label="Active address"
              checked={Boolean(isActive)}
              onCheckedChange={onToggleActive}
            />
          </div>
        ) : null}
        {canUpdate && onTogglePrimary && !isPrimary && isActive !== false ? (
          <div className="pt-1 sm:hidden">
            <SwitchField
              label="Primary address"
              description="Use as the customer's main contact address."
              checked={false}
              onCheckedChange={(checked) => {
                if (checked) {
                  onTogglePrimary();
                }
              }}
            />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-stretch gap-3 sm:items-end">
        <AddressCollectionActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
        {canUpdate && onToggleActive ? (
          <div className="hidden sm:block">
            <SwitchField
              label="Active address"
              checked={Boolean(isActive)}
              onCheckedChange={onToggleActive}
            />
          </div>
        ) : null}
        {canUpdate && onTogglePrimary && !isPrimary && isActive !== false ? (
          <div className="hidden sm:block">
            <SwitchField
              label="Primary address"
              description="Use as the customer's main contact address."
              checked={false}
              onCheckedChange={(checked) => {
                if (checked) {
                  onTogglePrimary();
                }
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ClientAddressGridCard({
  title,
  subtitle,
  summary,
  detailMode,
  details,
  isActive,
  showActiveBadge,
  isPrimary,
  showPrimaryBadge,
  canUpdate,
  onEdit,
  onDelete,
  onToggleActive,
  onTogglePrimary
}: {
  title: string;
  subtitle?: string;
  summary: string;
  detailMode?: CollectionDetailMode;
  details?: ReactNode;
  isActive?: boolean;
  showActiveBadge?: boolean;
  isPrimary?: boolean;
  showPrimaryBadge?: boolean;
  canUpdate: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onToggleActive?: (next: boolean) => void;
  onTogglePrimary?: () => void;
}) {
  const body =
    detailMode && details ? (
      <CollectionItemFieldDetails summary={summary} detailMode={detailMode}>
        {details}
      </CollectionItemFieldDetails>
    ) : (
      <p className="text-sm text-muted-foreground">{summary}</p>
    );

  return (
    <Card
      size="sm"
      className={cn('h-full', isPrimary && 'border-primary/20 bg-primary/5')}
    >
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{title}</span>
          {showActiveBadge ? (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          ) : null}
          {showPrimaryBadge && isPrimary ? (
            <Badge variant="outline">Primary</Badge>
          ) : null}
        </CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        <CardAction>
          <AddressCollectionActions canUpdate={canUpdate} onEdit={onEdit} onDelete={onDelete} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {body}
        {canUpdate && onToggleActive ? (
          <SwitchField
            label="Active address"
            checked={Boolean(isActive)}
            onCheckedChange={onToggleActive}
          />
        ) : null}
        {canUpdate && onTogglePrimary && !isPrimary && isActive !== false ? (
          <SwitchField
            label="Primary address"
            description="Use as the customer's main contact address."
            checked={false}
            onCheckedChange={(checked) => {
              if (checked) {
                onTogglePrimary();
              }
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ClientAddressSections({
  address,
  fieldConfig,
  template
}: {
  address: FineractClientAddress;
  fieldConfig: FineractAddressFieldConfig[];
  template: FineractClientAddressTemplate;
}) {
  return (
    <DetailFieldGrid>
      {isFieldEnabled(fieldConfig, 'street') ? (
        <DetailField label="Street">
          <TextValue value={address.street} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine1') ? (
        <DetailField label={shouldUseLocationCascade(fieldConfig) ? 'Sub-county' : 'Address line 1'}>
          <TextValue value={address.addressLine1} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine2') ? (
        <DetailField label={shouldUseLocationCascade(fieldConfig) ? 'Parish' : 'Address line 2'}>
          <TextValue value={address.addressLine2} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine3') ? (
        <DetailField label="Address line 3">
          <TextValue value={address.addressLine3} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'townVillage') ? (
        <DetailField label={shouldUseLocationCascade(fieldConfig) ? 'Village' : 'Town / village'}>
          <TextValue value={address.townVillage} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'city') ? (
        <DetailField label={shouldUseLocationCascade(fieldConfig) ? 'District' : 'City'}>
          <TextValue value={address.city} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'stateProvinceId') ? (
        <DetailField label={shouldUseLocationCascade(fieldConfig) ? 'Region' : 'State / province'}>
          <TextValue
            value={optionLabel(template.stateProvinceIdOptions, address.stateProvinceId)}
          />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'countryId') ? (
        <DetailField label="Country">
          <TextValue value={optionLabel(template.countryIdOptions, address.countryId)} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'postalCode') ? (
        <DetailField label="Postal code">
          <TextValue value={address.postalCode} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'countyDistrict') ? (
        <DetailField label={shouldUseLocationCascade(fieldConfig) ? 'County' : 'County district'}>
          <TextValue value={address.countyDistrict} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'isActive') ? (
        <DetailField label="Active">
          <TextValue value={address.isActive ? 'Yes' : 'No'} />
        </DetailField>
      ) : null}
      <DetailField label="Primary">
        <TextValue value={address.isPrimary ? 'Yes' : 'No'} />
      </DetailField>
    </DetailFieldGrid>
  );
}

export function ClientAddressPanel({
  address,
  fieldConfig,
  template,
  canUpdate,
  onEdit,
  onToggleActive
}: {
  address: FineractClientAddress;
  fieldConfig: FineractAddressFieldConfig[];
  template: FineractClientAddressTemplate;
  canUpdate: boolean;
  onEdit: () => void;
  onToggleActive: (next: boolean) => void;
}) {
  return (
    <DetailSection
      title={address.addressType}
      description={address.relationship}
      actions={
        canUpdate ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={onEdit}
            >
              Edit
            </button>
          </div>
        ) : null
      }
    >
      <ClientAddressSections address={address} fieldConfig={fieldConfig} template={template} />
      {canUpdate && isFieldEnabled(fieldConfig, 'isActive') ? (
        <div className="mt-4 border-t pt-4">
          <SwitchField
            label="Active address"
            checked={Boolean(address.isActive)}
            onCheckedChange={onToggleActive}
          />
        </div>
      ) : null}
    </DetailSection>
  );
}
