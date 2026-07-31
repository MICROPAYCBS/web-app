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
import { clientIdentifierSchema, countValidClientIdentifiers, CLIENT_IDENTIFIERS_REQUIRED_MESSAGE } from './client-identifier.schema';
import { complianceProfileSchema } from './compliance-profile.schema';
import { clientContactSchema } from './client-contact.schema';
import { ugandaMobileInternationalSchema, optionalUgandaMobileInternationalSchema } from '../uganda-mobile';

const namePattern = /^[A-Za-z].*/;
const fineractDate = z.string().trim().min(1);
const optionalFineractDate = z.string().trim().optional();

/** Fineract `Client.fullname` column limit for entity clients. */
export const ENTITY_CLIENT_FULLNAME_MAX_LENGTH = 160;
/** Fineract `ClientNonPerson.remarks` column limit. */
export const ENTITY_CLIENT_REMARKS_MAX_LENGTH = 150;

export const clientNonPersonDetailsSchema = z.object({
  constitutionId: z.coerce.number().int().positive(),
  incorpValidityTillDate: optionalFineractDate,
  incorpNumber: z.string().trim().max(50).optional(),
  mainBusinessLineId: z.coerce.number().int().positive().optional(),
  remarks: z.string().trim().max(ENTITY_CLIENT_REMARKS_MAX_LENGTH).optional(),
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

export const CLIENT_FAMILY_MEMBERS_REQUIRED_MESSAGE =
  'Add at least one next of kin for individual customers';

/** Fineract `m_address` text columns (Micropay mapping). */
export const CLIENT_ADDRESS_TEXT_MAX_LENGTH = 100;
/** Fineract `m_address.postal_code` — postal/ZIP only, not geographic names. */
export const CLIENT_ADDRESS_POSTAL_CODE_MAX_LENGTH = 20;

export const clientAddressEntrySchema = z.object({
  addressTypeId: z.coerce.number().int().positive().optional(),
  postalCode: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_POSTAL_CODE_MAX_LENGTH, {
      message: 'Postal code must be 20 characters or fewer.'
    })
    .optional(),
  street: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_TEXT_MAX_LENGTH, {
      message: 'Street must be 100 characters or fewer.'
    })
    .optional(),
  addressLine1: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_TEXT_MAX_LENGTH, {
      message: 'SubCounty must be 100 characters or fewer.'
    })
    .optional(),
  addressLine2: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_TEXT_MAX_LENGTH, {
      message: 'Parish must be 100 characters or fewer.'
    })
    .optional(),
  addressLine3: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_TEXT_MAX_LENGTH, {
      message: 'Must be 100 characters or fewer.'
    })
    .optional(),
  townVillage: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_TEXT_MAX_LENGTH, {
      message: 'Village must be 100 characters or fewer.'
    })
    .optional(),
  city: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_TEXT_MAX_LENGTH, {
      message: 'District must be 100 characters or fewer.'
    })
    .optional(),
  stateProvinceId: z.coerce.number().int().positive().optional(),
  countryId: z.coerce.number().int().positive().optional(),
  countyDistrict: z
    .string()
    .trim()
    .max(CLIENT_ADDRESS_TEXT_MAX_LENGTH, {
      message: 'County must be 100 characters or fewer.'
    })
    .optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional()
});

export const datatablePayloadSchema = z.object({
  registeredTableName: z.string().min(1),
  data: z.record(z.unknown())
});

const clientGenderIdSchema = z.union([z.literal(GENDER_MALE), z.literal(GENDER_FEMALE)]);

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
  fullname: z.string().trim().min(1).max(ENTITY_CLIENT_FULLNAME_MAX_LENGTH).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  clientNonPersonDetails: clientNonPersonDetailsSchema
});

export const createClientSchema = z
  .discriminatedUnion('legalFormId', [personClientSchema, entityClientSchema])
  .superRefine((data, ctx) => {
    if (data.legalFormId === LEGAL_FORM_PERSON && !data.dateOfBirth?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date of birth is required',
        path: ['dateOfBirth']
      });
    }
    if (
      data.legalFormId === LEGAL_FORM_ENTITY &&
      data.clientNonPersonDetails.incorpValidityTillDate?.trim() &&
      !data.dateOfBirth?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Incorporation date is required when validity till date is set',
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
    if (!data.customerClassId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer class is required',
        path: ['customerClassId']
      });
    }
    if (data.legalFormId === LEGAL_FORM_PERSON && !data.genderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gender is required',
        path: ['genderId']
      });
    }
    if (data.legalFormId === LEGAL_FORM_PERSON && !data.nationalityCountryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nationality is required',
        path: ['nationalityCountryId']
      });
    }
    if (data.legalFormId === LEGAL_FORM_PERSON && !data.maritalStatusId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Marital status is required',
        path: ['maritalStatusId']
      });
    }
    if (data.legalFormId === LEGAL_FORM_PERSON) {
      if (countValidClientIdentifiers(data.clientIdentifiers) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: CLIENT_IDENTIFIERS_REQUIRED_MESSAGE,
          path: ['clientIdentifiers']
        });
      }
      if (!data.familyMembers?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: CLIENT_FAMILY_MEMBERS_REQUIRED_MESSAGE,
          path: ['familyMembers']
        });
      }
    }
    if (data.address?.length) {
      const primaryCount = data.address.filter((entry) => entry.isPrimary).length;
      if (primaryCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Exactly one address must be marked as primary',
          path: ['address']
        });
      }
      const inactivePrimary = data.address.find((entry) => entry.isPrimary && entry.isActive === false);
      if (inactivePrimary) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Primary address must be active',
          path: ['address']
        });
      }
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
