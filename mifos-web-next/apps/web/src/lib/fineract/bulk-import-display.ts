/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Map client bulk-import legal form selection to Fineract legalFormType query value. */
export function resolveClientLegalFormTypeFromSelection(
  legalForm: string | undefined
): string | undefined {
  switch (legalForm) {
    case 'Person':
      return 'CLIENTS_PERSON';
    case 'Entity':
      return 'CLIENTS_ENTITY';
    default:
      return undefined;
  }
}

/** Infer legalFormType from uploaded filename when the form has no legal form field. */
export function resolveClientLegalFormTypeFromFilename(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  if (lower.includes('entity')) {
    return 'CLIENTS_ENTITY';
  }
  if (lower.includes('person')) {
    return 'CLIENTS_PERSON';
  }
  return undefined;
}
