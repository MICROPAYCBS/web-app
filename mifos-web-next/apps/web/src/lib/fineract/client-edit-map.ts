/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientEditData } from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON, type UpdateClientInput } from '@mifos/validation';
import {
  fineractApiDateToFormString,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';

/** Map Fineract edit template response to validated form input. */
export function mapClientToEditFormInput(data: FineractClientEditData): UpdateClientInput {
  const dateCtx = resolveFineractDateContext(data);
  const legalFormId = data.legalForm?.id ?? LEGAL_FORM_PERSON;
  const details = data.clientNonPersonDetails;

  const submittedOnDate = fineractApiDateToFormString(data.timeline?.submittedOnDate, dateCtx);
  const activationDate = fineractApiDateToFormString(
    data.timeline?.activatedOnDate ?? data.activationDate,
    dateCtx
  );

  const base = {
    staffId: data.staffId,
    legalFormId,
    externalId: data.externalId ?? '',
    mobileNo: data.mobileNo ?? '',
    emailAddress: data.emailAddress ?? '',
    taxIdentificationNumber: data.taxIdentificationNumber ?? '',
    alternativeMobileNo: data.alternativeMobileNo ?? '',
    alternativeEmailAddress: data.alternativeEmailAddress ?? '',
    subIndustryId: data.subIndustryId,
    titleId: data.title?.id,
    nationalityCountryId: data.nationality?.id,
    customerRiskProfileId: data.customerRiskProfile?.id,
    dateOfBirth: fineractApiDateToFormString(data.dateOfBirth, dateCtx),
    genderId: data.gender?.id,
    isStaff: data.isStaff ?? false,
    clientTypeId: data.clientType?.id,
    clientClassificationId: data.clientClassification?.id,
    submittedOnDate: submittedOnDate ?? '',
    active: data.active,
    activationDate,
    dateFormat: dateCtx.dateFormat,
    locale: dateCtx.locale
  };

  if (legalFormId === LEGAL_FORM_ENTITY) {
    return {
      ...base,
      legalFormId: LEGAL_FORM_ENTITY,
      fullname: data.fullname ?? data.displayName ?? '',
      clientNonPersonDetails: {
        constitutionId:
          details?.constitution?.id ??
          data.clientNonPersonConstitutionOptions?.[0]?.id ??
          1,
        incorpValidityTillDate: fineractApiDateToFormString(
          details?.incorpValidityTillDate,
          dateCtx
        ),
        incorpNumber: details?.incorpNumber ?? '',
        mainBusinessLineId: details?.mainBusinessLine?.id,
        remarks: details?.remarks ?? ''
      }
    };
  }

  return {
    ...base,
    legalFormId: LEGAL_FORM_PERSON,
    firstname: data.firstname ?? '',
    middlename: data.middlename ?? '',
    lastname: data.lastname ?? ''
  };
}
