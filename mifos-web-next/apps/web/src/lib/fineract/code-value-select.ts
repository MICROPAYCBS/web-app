/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Tooltip beside labels for selects backed by Administration → Codes lookups. */
export function codeValueSelectHint(codeName: string): string {
  return `Options come from the ${codeName} lookup. Add or activate values under Administration → Codes if this list is empty.`;
}

/** Shown in the combobox and below the field when no options are available. */
export function codeValueSelectEmptyMessage(codeName: string): string {
  return `No active values in ${codeName}. Add entries under Administration → Codes.`;
}
