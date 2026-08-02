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
import { optionalUgandaMobileInternationalSchema } from '../uganda-mobile';
import {
  clientAddressEntrySchema,
  clientNonPersonDetailsSchema,
  ENTITY_CLIENT_FULLNAME_MAX_LENGTH
} from './create-client.schema';

const namePattern = /^[A-Za-z].*/;
const fineractDate = z.string().trim().min(1);
const optionalFineractDate = z.string().trim().optional();
const clientGenderIdSchema = z.union([z.literal(GENDER_MALE), z.literal(GENDER_FEMALE)]);

/**
 * Activated create from the platform Clients Excel template (guided import).
 * Omits Micropay KYC requirements (customer class, nationality, family, identifiers).
 */
const legacyImportBaseSchema = z.object({
  officeId: z.coerce.number().int().positive(),
  staffId: z.coerce.number().int().positive().optional(),
  legalFormId: z.coerce.number().int(),
  externalId: z.string().trim().max(100).optional(),
  mobileNo: optionalUgandaMobileInternationalSchema,
  dateOfBirth: optionalFineractDate,
  genderId: clientGenderIdSchema.optional(),
  isStaff: z.boolean().optional(),
  clientTypeId: z.coerce.number().int().positive().optional(),
  submittedOnDate: fineractDate,
  active: z.literal(true),
  activationDate: fineractDate,
  savingsProductId: z.coerce.number().int().positive().optional(),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  address: z.array(clientAddressEntrySchema).optional()
});

const legacyImportPersonSchema = legacyImportBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_PERSON),
  firstname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  middlename: z.string().trim().max(50).regex(namePattern).optional().or(z.literal('')),
  lastname: z.string().trim().min(1).max(50).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  })
});

const legacyImportEntitySchema = legacyImportBaseSchema.extend({
  legalFormId: z.literal(LEGAL_FORM_ENTITY),
  fullname: z.string().trim().min(1).max(ENTITY_CLIENT_FULLNAME_MAX_LENGTH).regex(namePattern, {
    message: 'Name cannot begin with a number or special character'
  }),
  clientNonPersonDetails: clientNonPersonDetailsSchema
});

export const legacyImportClientSchema = z
  .discriminatedUnion('legalFormId', [legacyImportPersonSchema, legacyImportEntitySchema])
  .superRefine((data, ctx) => {
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

export type LegacyImportClientInput = z.input<typeof legacyImportClientSchema>;
export type LegacyImportClientPayload = z.output<typeof legacyImportClientSchema>;

export function validateLegacyImportClient(input: unknown) {
  return legacyImportClientSchema.safeParse(input);
}
