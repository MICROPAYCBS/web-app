/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** True when outbound email properties look configured enough to send mail. */
export function isSmtpDeliveryConfigured(
  properties: Array<{ name: string; value?: string | null }>
): boolean {
  const byName = new Map(
    properties.map((property) => [property.name, String(property.value ?? '').trim()])
  );
  // Password may be masked/blank on read; host + port + from address are enough signal.
  return Boolean(byName.get('host') && byName.get('port') && byName.get('fromEmail'));
}
