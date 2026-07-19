/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required.'),
  description: z.string().trim().min(1, 'Description is required.')
});

export const updateRoleSchema = z.object({
  description: z.string().trim().min(1, 'Description is required.')
});

export const updateRolePermissionsSchema = z.object({
  permissions: z
    .record(z.string(), z.boolean())
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Select at least one permission state to update.'
    })
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;

export function validateCreateRole(input: unknown) {
  return createRoleSchema.safeParse(input);
}

export function validateUpdateRole(input: unknown) {
  return updateRoleSchema.safeParse(input);
}

export function validateUpdateRolePermissions(input: unknown) {
  return updateRolePermissionsSchema.safeParse(input);
}
