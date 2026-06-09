/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export function clientCollateralListPath(clientId: string | number): string {
  return `/clients/${clientId}/collateral`;
}

export function clientCollateralCreatePath(clientId: string | number): string {
  return `${clientCollateralListPath(clientId)}?create=1`;
}

export function clientStandingInstructionsListPath(clientId: string | number): string {
  return `/clients/${clientId}/standing-instructions`;
}

export function clientStandingInstructionsCreatePath(
  clientId: string | number,
  officeId?: number
): string {
  const params = new URLSearchParams({ create: '1', accountType: 'fromsavings' });
  if (officeId !== undefined) {
    params.set('officeId', String(officeId));
  }
  return `${clientStandingInstructionsListPath(clientId)}?${params.toString()}`;
}
