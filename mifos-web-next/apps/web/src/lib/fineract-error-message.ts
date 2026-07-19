/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Split a Fineract message into a toast/alert title and optional body lines. */
export function splitFineractErrorMessage(message: string): {
  title: string;
  description?: string;
} {
  const text = message.trim();
  const newline = text.indexOf('\n');
  if (newline === -1) {
    return { title: text };
  }

  const title = text.slice(0, newline).trim();
  const description = text.slice(newline + 1).trim();
  return {
    title: title || text,
    description: description || undefined
  };
}
