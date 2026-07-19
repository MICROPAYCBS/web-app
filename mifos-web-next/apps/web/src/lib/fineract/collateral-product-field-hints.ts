/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * User-facing explanations for collateral product fields.
 * Valuation when linked to a client matches `client-collateral-display.ts`.
 */

export const COLLATERAL_PRODUCT_BASE_PRICE_HINT =
  'Standard value for one unit of this collateral (in the selected currency), according to your unit type—for example per item or per square meter. When assigned to a client, total value = base price × quantity.';

export const COLLATERAL_PRODUCT_PCT_TO_BASE_HINT =
  'Percentage of total value that counts as collateral security (0–100). Collateral value = base price × quantity × (percentage ÷ 100). Example: base price 50,000, quantity 2, percentage 80 → total value 100,000, collateral value 80,000.';
