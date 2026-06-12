/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { PasswordPreferenceTemplateItem } from '@mifos/api-client';

const PASSWORD_PREFERENCE_LABELS: Record<number, string> = {
  1: 'Basic',
  2: 'Standard',
  3: 'Strong'
};

/** Legacy Angular maps ids 1–3 to Basic / Standard / Strong. */
export function passwordPreferenceLabel(preference: PasswordPreferenceTemplateItem): string {
  return PASSWORD_PREFERENCE_LABELS[preference.id] ?? preference.key ?? `Policy ${preference.id}`;
}

export function findActivePasswordPreferenceId(
  preferences: PasswordPreferenceTemplateItem[]
): number | null {
  const active = preferences.find((preference) => preference.active);
  return active?.id ?? null;
}

/** Normalize known Fineract template typos (legacy translateKey parity). */
export function passwordPreferenceDescription(description: string | undefined): string {
  if (!description?.trim()) {
    return '';
  }

  const knownDescriptions: Record<string, string> = {
    'Password most be at least 1 character and not more that 50 characters long':
      'Password must be at least 1 character and not more than 50 characters long',
    'Password must be at least 1 character and not more than 50 characters long':
      'Password must be at least 1 character and not more than 50 characters long'
  };

  return knownDescriptions[description] ?? description;
}
