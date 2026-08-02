/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientIdentifierTemplate,
  FineractClientTemplate,
  FineractStaffListItem
} from '@mifos/api-client';
import { GENDER_OPTIONS } from '@mifos/validation';
import type { ClientsImportLookups } from '@/lib/clients/clients-import';

function staffDisplayName(staff: FineractStaffListItem): string {
  if (staff.firstname || staff.lastname) {
    return [staff.firstname, staff.lastname].filter(Boolean).join(' ').trim();
  }
  return `Staff #${staff.id}`;
}

export function buildClientsImportLookups(input: {
  template: FineractClientTemplate;
  staff: FineractStaffListItem[];
  identifierTemplate: FineractClientIdentifierTemplate;
}): ClientsImportLookups {
  const { template, staff, identifierTemplate } = input;
  const address = template.address?.[0];

  const identityFromGuides =
    identifierTemplate.identityTypeOptions
      ?.filter((option) => option.status !== 'INACTIVE')
      .map((option) => ({
        id: option.codeValueId,
        name: option.codeValueName?.trim() || `Type #${option.codeValueId}`
      })) ?? [];

  const identityFromAllowed =
    identifierTemplate.allowedDocumentTypes?.map((type) => ({
      id: type.id,
      name: type.name
    })) ?? [];

  const identityTypes =
    identityFromGuides.length > 0
      ? identityFromGuides
      : identityFromAllowed;

  return {
    offices: (template.officeOptions ?? []).map((office) => ({
      id: office.id,
      name: office.name
    })),
    staff: staff.map((row) => ({
      id: row.id,
      name: staffDisplayName(row),
      officeName: row.officeName
    })),
    customerClasses: (template.customerClassOptions ?? []).map((row) => ({
      id: row.id,
      name: row.className || row.classCode,
      code: row.classCode
    })),
    genders:
      template.genderOptions?.map((option) => ({
        id: option.id,
        name: option.name ?? option.value ?? String(option.id)
      })) ?? GENDER_OPTIONS.map((option) => ({ id: option.id, name: option.name })),
    nationalities: (template.nationalityOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name ?? option.value ?? String(option.id)
    })),
    maritalStatuses: (template.maritalStatusOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name ?? option.value ?? String(option.id)
    })),
    identityTypes,
    familyRelationships: (template.familyMemberOptions?.relationshipIdOptions ?? []).map(
      (option) => ({
        id: option.id,
        name: option.name ?? option.value ?? String(option.id)
      })
    ),
    addressTypes: (address?.addressTypeIdOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name ?? option.value ?? String(option.id)
    })),
    countries: (address?.countryIdOptions ?? template.nationalityOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name ?? option.value ?? String(option.id)
    })),
    clientTypes: (template.clientTypeOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name ?? option.value ?? String(option.id)
    })),
    titles: (
      template.clientTitleOptions?.map((option) => ({
        id: option.id,
        name: option.titleName ?? option.titleCode ?? String(option.id),
        code: option.titleCode
      })) ??
      template.titleOptions?.map((option) => ({
        id: option.id,
        name: option.name ?? option.value ?? String(option.id)
      })) ??
      []
    ),
    stateProvinces: (address?.stateProvinceIdOptions ?? []).map((option) => ({
      id: option.id,
      name: option.name ?? option.value ?? String(option.id)
    }))
  };
}
