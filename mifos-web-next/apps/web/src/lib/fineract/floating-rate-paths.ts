/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const FLOATING_RATES_PATH = '/products/floating-rates';

export function floatingRatesListPath(): string {
  return FLOATING_RATES_PATH;
}

export function floatingRateDetailPath(floatingRateId: string | number): string {
  return `${FLOATING_RATES_PATH}/${floatingRateId}`;
}

export function floatingRateCreatePath(): string {
  return `${FLOATING_RATES_PATH}/create`;
}

export function floatingRateEditPath(floatingRateId: string | number): string {
  return `${floatingRateDetailPath(floatingRateId)}/edit`;
}
