/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Lookup name for customer identifier types (passport, national ID, etc.). */
export const CUSTOMER_IDENTIFIER_CODE_NAME = 'Customer Identifier';

export function customerIdentifierCodePath(codeId?: number): string {
  return codeId != null ? `/system/codes/${codeId}` : '/system/codes';
}
