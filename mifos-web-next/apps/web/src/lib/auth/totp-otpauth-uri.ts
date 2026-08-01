/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Replace issuer + account label in a TOTP otpauth URI (Fineract defaults to "Fineract"). */
export function rebrandTotpOtpauthUri(otpauthUri: string, issuer: string): string {
  const trimmed = otpauthUri.trim();
  if (!trimmed.startsWith('otpauth://totp/')) {
    return otpauthUri;
  }

  try {
    const url = new URL(trimmed);
    const pathLabel = decodeURIComponent(url.pathname.replace(/^\//, ''));
    const separator = pathLabel.indexOf(':');
    const username = separator >= 0 ? pathLabel.slice(separator + 1) : pathLabel;
    const params = new URLSearchParams(url.search);
    params.set('issuer', issuer);
    const label = encodeURIComponent(`${issuer}:${username}`);
    return `otpauth://totp/${label}?${params.toString()}`;
  } catch {
    return otpauthUri;
  }
}
