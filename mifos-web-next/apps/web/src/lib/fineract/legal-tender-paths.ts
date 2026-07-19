/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const LEGAL_TENDER_HUB_PATH = '/organization/legal-tenders';

export function legalTenderListPath(currencyCode: string): string {
  return `/organization/currencies/${encodeURIComponent(currencyCode)}/legal-tenders`;
}

export function legalTenderCreatePath(currencyCode: string): string {
  return `${legalTenderListPath(currencyCode)}?create=1`;
}

export function legalTenderEditPath(currencyCode: string, legalTenderId: string | number): string {
  return `${legalTenderListPath(currencyCode)}?edit=${legalTenderId}`;
}

export function legalTenderLegacyCreatePath(currencyCode: string): string {
  return `${legalTenderListPath(currencyCode)}/create`;
}

export function legalTenderLegacyEditPath(
  currencyCode: string,
  legalTenderId: string | number
): string {
  return `${legalTenderListPath(currencyCode)}/${legalTenderId}/edit`;
}
