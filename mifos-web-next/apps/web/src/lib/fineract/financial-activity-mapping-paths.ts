/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const FINANCIAL_ACTIVITY_MAPPING_LIST_PATH = '/accounting/financial-activity-mappings';

export function financialActivityMappingCreatePath(): string {
  return `${FINANCIAL_ACTIVITY_MAPPING_LIST_PATH}?create=1`;
}

export function financialActivityMappingEditPath(mappingId: string | number): string {
  return `${FINANCIAL_ACTIVITY_MAPPING_LIST_PATH}?edit=${mappingId}`;
}

export function financialActivityMappingDetailPath(mappingId: string | number): string {
  return `${FINANCIAL_ACTIVITY_MAPPING_LIST_PATH}/${mappingId}`;
}
