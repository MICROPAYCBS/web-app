/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const updateOrganizationCurrenciesSchema = z.object({
  currencies: z.array(z.string().trim().min(1).max(3))
});

export type UpdateOrganizationCurrenciesInput = z.input<typeof updateOrganizationCurrenciesSchema>;
export type UpdateOrganizationCurrenciesPayload = z.output<typeof updateOrganizationCurrenciesSchema>;

export function validateUpdateOrganizationCurrencies(input: unknown) {
  return updateOrganizationCurrenciesSchema.safeParse(input);
}
