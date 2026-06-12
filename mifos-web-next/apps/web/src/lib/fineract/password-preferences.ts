import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  PasswordPreferencesMutationResponse,
  PasswordPreferenceTemplateItem
} from '@mifos/api-client';
import type { UpdatePasswordPreferencesPayload } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/passwordpreferences';

export async function getPasswordPreferencesTemplate(): Promise<PasswordPreferenceTemplateItem[]> {
  const fineract = await createFineractClient();
  const response = await fineract.get<PasswordPreferenceTemplateItem[]>(`${BASE_PATH}/template`);
  return Array.isArray(response) ? response : [];
}

export async function updatePasswordPreferences(
  input: UpdatePasswordPreferencesPayload
): Promise<PasswordPreferencesMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<PasswordPreferencesMutationResponse>(BASE_PATH, input);
}
