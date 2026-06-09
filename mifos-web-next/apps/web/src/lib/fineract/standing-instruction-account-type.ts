/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Maps legacy `accountType` query param to Fineract `fromAccountType`. */
export function standingInstructionFromAccountTypeParam(
  accountType?: string | null
): '0' | '1' | '2' {
  switch (accountType) {
    case 'fromloans':
      return '1';
    case 'fromsavings':
      return '2';
    default:
      return '0';
  }
}
