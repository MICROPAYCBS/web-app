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
import { clientNonPersonDetailsSchema } from './create-client.schema';
import { optionalUgandaMobileInternationalSchema } from '../uganda-mobile';

const namePattern = /^[A-Za-z].*/;
const fineractDate = z.string().trim().min(1);
const optionalFineractDate = z.string().trim().optional();
const clientGenderIdSchema = z.union([z.literal(GENDER_MALE), z.literal(GENDER_FEMALE)]);

const updateClientBaseSchema = z.object({
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
  active: z.boolean(),
  activationDate: optionalFineractDate,
  dateFormat: z.string().optional(),
  locale: z.string().optional()
});

const updatePersonSchema = updateClientBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_PERSON),
  firstname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  middlename: z.string().trim().max(50).regex(namePattern).optional().or(z.literal('')),
  lastname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  })
});

const updateEntitySchema = updateClientBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_ENTITY),
  fullname: z.string().trim().min(1).max(100).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  clientNonPersonDetails: clientNonPersonDetailsSchema
});

export const updateClientSchema = z
  .discriminatedUnion('legalFormId', [updatePersonSchema, updateEntitySchema])
  .superRefine((data, ctx) => {
    if (data.legalFormId === LEGAL_FORM_PERSON && !data.maritalStatusId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Marital status is required',
        path: ['maritalStatusId']
      });
    }
  });

export type UpdateClientInput = z.input<typeof updateClientSchema>;
export type UpdateClientPayload = z.output<typeof updateClientSchema>;
