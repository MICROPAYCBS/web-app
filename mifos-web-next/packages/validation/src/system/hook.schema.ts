/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const hookEventSchema = z.object({
  entityName: z.string().trim().min(1, 'Entity is required.'),
  actionName: z.string().trim().min(1, 'Action is required.')
});

const hookFormBaseSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required.'),
  isActive: z.boolean(),
  payloadUrl: z.string().trim().min(1, 'Payload URL is required.'),
  events: z.array(hookEventSchema).min(1, 'Add at least one event.')
});

export const webHookFormSchema = hookFormBaseSchema.extend({
  name: z.literal('Web'),
  contentType: z.enum(['json', 'form'], {
    errorMap: () => ({ message: 'Content type is required.' })
  })
});

export const smsHookFormSchema = hookFormBaseSchema.extend({
  name: z.literal('SMS Bridge'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .max(10, 'Phone number must be at most 10 characters.'),
  smsProvider: z.string().trim().min(1, 'SMS provider is required.'),
  smsProviderAccountId: z.string().trim().min(1, 'SMS provider account ID is required.'),
  smsProviderToken: z.string().trim().min(1, 'SMS provider token is required.')
});

export const upsertHookFormSchema = z.discriminatedUnion('name', [
  webHookFormSchema,
  smsHookFormSchema
]);

export type HookEventInput = z.infer<typeof hookEventSchema>;
export type WebHookFormInput = z.infer<typeof webHookFormSchema>;
export type SmsHookFormInput = z.infer<typeof smsHookFormSchema>;
export type UpsertHookFormInput = z.infer<typeof upsertHookFormSchema>;

export function validateUpsertHookForm(input: unknown) {
  return upsertHookFormSchema.safeParse(input);
}

export function buildHookConfigPayload(input: UpsertHookFormInput): Record<string, string> {
  if (input.name === 'Web') {
    return {
      'Content Type': input.contentType,
      'Payload URL': input.payloadUrl
    };
  }

  return {
    'Payload URL': input.payloadUrl,
    'Phone Number': input.phoneNumber,
    'SMS Provider': input.smsProvider,
    'SMS Provider Account Id': input.smsProviderAccountId,
    'SMS Provider Token': input.smsProviderToken
  };
}

export function buildHookApiPayload(input: UpsertHookFormInput) {
  return {
    name: input.name,
    displayName: input.displayName,
    isActive: input.isActive,
    events: input.events,
    config: buildHookConfigPayload(input)
  };
}
