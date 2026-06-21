/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from './legal-form';
import { incomeSourceSchema } from './income-source.schema';
import { clientIdentifierSchema } from './client-identifier.schema';
import { complianceProfileSchema } from './compliance-profile.schema';
import { ugandaMobileInternationalSchema, optionalUgandaMobileInternationalSchema } from '../uganda-mobile';

const namePattern = /^[A-Za-z].*/;
const fineractDate = z.string().trim().min(1);
const optionalFineractDate = z.string().trim().optional();

export const clientNonPersonDetailsSchema = z.object({
  constitutionId: z.coerce.number().int().positive(),
  incorpValidityTillDate: optionalFineractDate,
  incorpNumber: z.string().trim().max(50).optional(),
  mainBusinessLineId: z.coerce.number().int().positive().optional(),
  remarks: z.string().trim().max(300).optional(),
  dateFormat: z.string().optional(),
  locale: z.string().optional()
});

export const familyMemberSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  middleName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().min(1).max(50),
  qualification: z.string().trim().max(100).optional(),
  age: z.coerce.number().int().nonnegative().optional(),
  isDependent: z.boolean().optional(),
  relationshipId: z.coerce.number().int().positive(),
  genderId: z.coerce.number().int().positive(),
  professionId: z.coerce.number().int().positive().optional(),
  maritalStatusId: z.coerce.number().int().positive().optional(),
  mobileNumber: optionalUgandaMobileInternationalSchema,
  emailAddress: z.string().trim().email().max(50).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  dateOfBirth: optionalFineractDate,
  dateFormat: z.string().optional(),
  locale: z.string().optional()
});

export const clientAddressEntrySchema = z.object({
  addressTypeId: z.coerce.number().int().positive().optional(),
  postalCode: z.string().trim().max(20).optional(),
  street: z.string().trim().max(200).optional(),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  addressLine3: z.string().trim().max(200).optional(),
  townVillage: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  stateProvinceId: z.coerce.number().int().positive().optional(),
  countryId: z.coerce.number().int().positive().optional(),
  countyDistrict: z.string().trim().max(100).optional(),
  isActive: z.boolean().optional()
});

export const datatablePayloadSchema = z.object({
  registeredTableName: z.string().min(1),
  data: z.record(z.unknown())
});

const clientBaseSchema = z.object({
  officeId: z.coerce.number().int().positive(),
  staffId: z.coerce.number().int().positive().optional(),
  legalFormId: z.coerce.number().int(),
  externalId: z.string().trim().max(100).optional(),
  mobileNo: ugandaMobileInternationalSchema,
  emailAddress: z.string().trim().email().optional().or(z.literal('')),
  taxIdentificationNumber: z.string().trim().max(50).optional().or(z.literal('')),
  alternativeMobileNo: optionalUgandaMobileInternationalSchema,
  alternativeEmailAddress: z.string().trim().email().optional().or(z.literal('')),
  subIndustryId: z.coerce.number().int().positive().optional(),
  titleId: z.coerce.number().int().positive().optional(),
  nationalityCountryId: z.coerce.number().int().positive().optional(),
  customerRiskProfileId: z.coerce.number().int().positive().optional(),
  dateOfBirth: optionalFineractDate,
  genderId: z.coerce.number().int().positive().optional(),
  isStaff: z.boolean().optional(),
  clientTypeId: z.coerce.number().int().positive().optional(),
  clientClassificationId: z.coerce.number().int().positive().optional(),
  submittedOnDate: fineractDate,
  savingsProductId: z.coerce.number().int().positive().optional(),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  familyMembers: z.array(familyMemberSchema).optional(),
  incomeSources: z.array(incomeSourceSchema).optional(),
  clientIdentifiers: z.array(clientIdentifierSchema).optional(),
  complianceProfile: complianceProfileSchema.optional(),
  address: z.array(clientAddressEntrySchema).optional(),
  datatables: z.array(datatablePayloadSchema).optional()
});

const personClientSchema = clientBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_PERSON),
  firstname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  middlename: z.string().trim().max(50).regex(namePattern).optional().or(z.literal('')),
  lastname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  })
});

const entityClientSchema = clientBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_ENTITY),
  fullname: z.string().trim().min(1).max(100).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  clientNonPersonDetails: clientNonPersonDetailsSchema
});

export const createClientSchema = z
  .discriminatedUnion('legalFormId', [personClientSchema, entityClientSchema])
  .superRefine((data, ctx) => {
    if (!data.dateOfBirth?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.legalFormId === LEGAL_FORM_PERSON
            ? 'Date of birth is required'
            : 'Incorporation date is required',
        path: ['dateOfBirth']
      });
    }
    if (!data.staffId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Relationship officer is required',
        path: ['staffId']
      });
    }
    if (!data.clientTypeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer type is required',
        path: ['clientTypeId']
      });
    }
    if (data.legalFormId === LEGAL_FORM_PERSON && !data.genderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gender is required',
        path: ['genderId']
      });
    }
  });

export type CreateClientInput = z.input<typeof createClientSchema>;
export type CreateClientPayload = z.output<typeof createClientSchema>;
export type FamilyMemberInput = z.input<typeof familyMemberSchema>;
export type ClientAddressEntry = z.infer<typeof clientAddressEntrySchema>;

/** Legacy sheet schema — person-only quick path (deprecated). */
export const createClientSheetSchema = z
  .object({
    officeId: z.coerce.number().int().positive(),
    firstname: z.string().trim().min(1).max(50),
    lastname: z.string().trim().min(1).max(50),
    middlename: z.string().trim().max(50).optional(),
    externalId: z.string().trim().max(100).optional(),
    active: z.boolean().default(false),
    activationDate: z.string().optional(),
    dateFormat: z.string().optional(),
    locale: z.string().optional(),
    submittedOnDate: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.active && !data.activationDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Activation date is required when the customer is active',
        path: ['activationDate']
      });
    }
  });
