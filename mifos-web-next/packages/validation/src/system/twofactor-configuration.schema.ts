/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const positiveInt = z.number().int().positive('Must be a whole number greater than zero.');

export const otpDeliveryMethodSchema = z.enum(['email', 'sms', 'totp'], {
  errorMap: () => ({ message: 'Select a delivery method.' })
});

export const updateTwoFactorConfigurationSchema = z
  .object({
    otpDeliveryMethod: otpDeliveryMethodSchema,
    emailSubject: z.string().trim().min(1, 'Email subject is required.').max(1000),
    emailBody: z.string().trim().min(1, 'Email body is required.').max(1000),
    smsProviderId: positiveInt,
    smsText: z.string().trim().min(1, 'SMS message is required.').max(1000),
    otpTokenLiveTime: positiveInt,
    otpTokenLength: positiveInt,
    accessTokenLiveTime: positiveInt,
    accessTokenLiveTimeExtended: positiveInt
  })
  .superRefine((value, ctx) => {
    if (value.accessTokenLiveTimeExtended < value.accessTokenLiveTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Extended session lifetime must be at least the standard lifetime.',
        path: ['accessTokenLiveTimeExtended']
      });
    }
  });

export type UpdateTwoFactorConfigurationInput = z.infer<typeof updateTwoFactorConfigurationSchema>;

export function validateUpdateTwoFactorConfiguration(input: unknown) {
  return updateTwoFactorConfigurationSchema.safeParse(input);
}
