/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Build a pathname from a route prefix and optional catch-all slug segments. */
export function pathnameFromSlug(prefix: string, slug?: string[]): string {
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  if (!slug?.length) {
    return base;
  }
  return `${base}/${slug.join('/')}`;
}
