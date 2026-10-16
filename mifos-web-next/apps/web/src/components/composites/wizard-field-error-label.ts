/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Strip required markers and the optional suffix from a form label. */
export function cleanFieldLabelText(text: string | null | undefined): string | undefined {
  if (!text) {
    return undefined;
  }
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s*\*\s*$/, '')
    .replace(/\s*\(optional\)\s*$/i, '')
    .trim();
  return cleaned || undefined;
}

/** Last path segment, split into words. `settings.overdueDaysForNPA` → "Overdue days for NPA". */
export function humanizeFieldKey(key: string): string {
  const leaf = key.split('.').filter(Boolean).pop() ?? key;
  const spaced = leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  const words = spaced.split(' ').filter(Boolean);
  return words
    .map((word, index) => {
      if (word === word.toUpperCase() && /[A-Z]/.test(word) && word.length > 1) {
        return word;
      }
      const lower = word.toLowerCase();
      if (index === 0) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join(' ');
}
