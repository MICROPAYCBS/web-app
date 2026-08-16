/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const TAX_CONFIGURATIONS_PATH = '/products/tax-configurations';
export const TAX_COMPONENTS_PATH = `${TAX_CONFIGURATIONS_PATH}/tax-components`;
export const TAX_GROUPS_PATH = `${TAX_CONFIGURATIONS_PATH}/tax-groups`;

export function taxConfigurationsPath(): string {
  return TAX_CONFIGURATIONS_PATH;
}

export function taxComponentsListPath(): string {
  return TAX_COMPONENTS_PATH;
}

export function taxComponentDetailPath(taxComponentId: string | number): string {
  return `${TAX_COMPONENTS_PATH}/${taxComponentId}`;
}

export function taxComponentCreatePath(): string {
  return `${TAX_COMPONENTS_PATH}?create=1`;
}

export function taxComponentEditPath(taxComponentId: string | number): string {
  return `${taxComponentDetailPath(taxComponentId)}?edit=1`;
}

export function taxGroupsListPath(): string {
  return TAX_GROUPS_PATH;
}

export function taxGroupDetailPath(taxGroupId: string | number): string {
  return `${TAX_GROUPS_PATH}/${taxGroupId}`;
}

export function taxGroupCreatePath(): string {
  return `${TAX_GROUPS_PATH}?create=1`;
}

export function taxGroupEditPath(taxGroupId: string | number): string {
  return `${taxGroupDetailPath(taxGroupId)}/edit`;
}
