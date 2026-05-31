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
import { SwitchField } from '@/components/composites/switch-field';
import { DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';

function isFieldEnabled(config: FineractAddressFieldConfig[], field: string): boolean {
  return config.find((f) => f.field === field)?.isEnabled ?? false;
}

function optionLabel(options: FineractEnumOption[] | undefined, id?: number): string | undefined {
  if (id == null || !options?.length) {
    return undefined;
  }
  return options.find((o) => o.id === id)?.name ?? options.find((o) => o.id === id)?.value;
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
        <DetailField label="Address line 1">
          <TextValue value={address.addressLine1} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine2') ? (
        <DetailField label="Address line 2">
          <TextValue value={address.addressLine2} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'addressLine3') ? (
        <DetailField label="Address line 3">
          <TextValue value={address.addressLine3} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'townVillage') ? (
        <DetailField label="Town / village">
          <TextValue value={address.townVillage} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'city') ? (
        <DetailField label="City">
          <TextValue value={address.city} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'stateProvinceId') ? (
        <DetailField label="State / province">
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
        <DetailField label="County district">
          <TextValue value={address.countyDistrict} />
        </DetailField>
      ) : null}
      {isFieldEnabled(fieldConfig, 'isActive') ? (
        <DetailField label="Active">
          <TextValue value={address.isActive ? 'Yes' : 'No'} />
        </DetailField>
      ) : null}
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
