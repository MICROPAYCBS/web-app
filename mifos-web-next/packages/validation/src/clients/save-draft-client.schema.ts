/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { GENDER_FEMALE, GENDER_MALE } from './gender';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from './legal-form';
import { incomeSourceSchema } from './income-source.schema';
import { clientIdentifierSchema } from './client-identifier.schema';
import { complianceProfileSchema } from './compliance-profile.schema';
import { clientContactSchema } from './client-contact.schema';
import { optionalUgandaMobileInternationalSchema } from '../uganda-mobile';
import {
  clientAddressEntrySchema,
  clientNonPersonDetailsSchema,
  datatablePayloadSchema,
  familyMemberSchema
} from './create-client.schema';

const namePattern = /^[A-Za-z].*/;
const fineractDate = z.string().trim().min(1);
const optionalFineractDate = z.string().trim().optional();
const clientGenderIdSchema = z.union([z.literal(GENDER_MALE), z.literal(GENDER_FEMALE)]);

/**
 * Soft create payload for draft customers (`POST /clients` with active omitted/false).
 * Requires office, legal form, submitted date, and person/entity name fields only.
 * Full KYC is optional until Submit (Draft → Pending).
 */
const saveDraftBaseSchema = z.object({
  officeId: z.coerce.number().int().positive(),
  staffId: z.coerce.number().int().positive().optional(),
  legalFormId: z.coerce.number().int(),
  externalId: z.string().trim().max(100).optional(),
  mobileNo: optionalUgandaMobileInternationalSchema,
  emailAddress: z.string().trim().email().optional().or(z.literal('')),
  taxIdentificationNumber: z.string().trim().max(50).optional().or(z.literal('')),
  alternativeMobileNo: optionalUgandaMobileInternationalSchema,
  alternativeEmailAddress: z.string().trim().email().optional().or(z.literal('')),
  subIndustryId: z.coerce.number().int().positive().optional(),
  customerClassId: z.coerce.number().int().positive().optional(),
  titleId: z.coerce.number().int().positive().optional(),
  nationalityCountryId: z.coerce.number().int().positive().optional(),
  customerRiskProfileId: z.coerce.number().int().positive().optional(),
  maritalStatusId: z.coerce.number().int().positive().optional(),
  dateOfBirth: optionalFineractDate,
  genderId: clientGenderIdSchema.optional(),
  isStaff: z.boolean().optional(),
  clientTypeId: z.coerce.number().int().positive().optional(),
  submittedOnDate: fineractDate,
  savingsProductId: z.coerce.number().int().positive().optional(),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  familyMembers: z.array(familyMemberSchema).optional(),
  incomeSources: z.array(incomeSourceSchema).optional(),
  clientIdentifiers: z.array(clientIdentifierSchema).optional(),
  complianceProfile: complianceProfileSchema.optional(),
  address: z.array(clientAddressEntrySchema).optional(),
  contacts: z.array(clientContactSchema).optional(),
  datatables: z.array(datatablePayloadSchema).optional()
});

const saveDraftPersonSchema = saveDraftBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_PERSON),
  firstname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  middlename: z.string().trim().max(50).regex(namePattern).optional().or(z.literal('')),
  lastname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  })
});

const saveDraftEntitySchema = saveDraftBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_ENTITY),
  fullname: z.string().trim().min(1).max(100).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  clientNonPersonDetails: clientNonPersonDetailsSchema
    .partial()
    .extend({
      constitutionId: z.coerce.number().int().positive().optional()
    })
    .optional()
});

export const saveDraftClientSchema = z.discriminatedUnion('legalFormId', [
  saveDraftPersonSchema,
  saveDraftEntitySchema
]);

export type SaveDraftClientInput = z.input<typeof saveDraftClientSchema>;
export type SaveDraftClientPayload = z.output<typeof saveDraftClientSchema>;
