/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const requestTwoFactorOtpSchema = z.object({
  deliveryMethod: z.string().trim().min(1, 'Select how to receive your code.')
});

export const validateTwoFactorOtpSchema = z.object({
  token: z.string().trim().min(1, 'Enter the verification code.')
});

export type RequestTwoFactorOtpInput = z.input<typeof requestTwoFactorOtpSchema>;
export type ValidateTwoFactorOtpInput = z.input<typeof validateTwoFactorOtpSchema>;

export function validateRequestTwoFactorOtp(input: unknown) {
  return requestTwoFactorOtpSchema.safeParse(input);
}

export function validateValidateTwoFactorOtp(input: unknown) {
  return validateTwoFactorOtpSchema.safeParse(input);
}
