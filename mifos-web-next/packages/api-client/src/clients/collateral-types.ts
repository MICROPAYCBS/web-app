/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from './accounts-types';

export interface CollateralProductOption {
  id: number;
  name: string;
}

export interface CollateralProductListItem {
  id: number;
  name?: string;
  quality?: string;
  unitType?: string;
  basePrice?: number;
  pctToBase?: number;
  currency?: FineractCurrencyOption | string;
}

export type CollateralProductDetail = CollateralProductListItem;

export interface CollateralProductTemplate {
  currencyOptions: FineractCurrencyOption[];
}

export interface CollateralProductMutationResponse {
  resourceId: number;
}

export interface ClientCollateralListItem {
  /** Client collateral link id (Fineract `id` on list/detail). */
  id?: number;
  /** Collateral product id when returned by the API. */
  collateralId?: number;
  name?: string;
  quantity?: number;
  basePrice?: number;
  pctToBase?: number;
  /** Fineract list DTO: `total` (base price × quantity). */
  total?: number;
  /** Fineract list DTO: `totalCollateral`. */
  totalCollateral?: number;
  currency?: FineractCurrencyOption | string;
}

export interface ClientCollateralTemplate {
  collateralOptions?: CollateralProductOption[];
}

export interface CreateClientCollateralResponse {
  resourceId: number;
}
