/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '@mifos/api-client';

/** Share products support none (1) and cash (2) only — template often omits rule options. */
export const SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS: FineractEnumOption[] = [
  { id: 1, value: 'None', code: 'NONE' },
  { id: 2, value: 'Cash', code: 'CASH' }
];
