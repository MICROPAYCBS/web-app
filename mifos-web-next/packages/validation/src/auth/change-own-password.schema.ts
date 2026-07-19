/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    password: z.string().min(1, 'New password is required.'),
    repeatPassword: z.string().min(1, 'Confirm password is required.')
  })
  .refine((value) => value.password === value.repeatPassword, {
    message: 'Passwords do not match.',
    path: ['repeatPassword']
  })
  .refine((value) => value.password !== value.currentPassword, {
    message: 'New password must be different from your current password.',
    path: ['password']
  });

export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;

export function validateChangeOwnPassword(input: unknown) {
  return changeOwnPasswordSchema.safeParse(input);
}
