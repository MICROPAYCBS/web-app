/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { translateFineractCode } from '@mifos/i18n';

const ACTIVE_CASHIER_REQUIRED_CODE = 'error.msg.cashier.active.session.required.exception';
const INSUFFICIENT_CASHIER_AMOUNT_CODE = 'error.msg.cashier.insufficient.amount.exception';

export function activeCashierRequiredMessage(): string {
  return translateFineractCode(
    ACTIVE_CASHIER_REQUIRED_CODE,
    'An active cashier session is required for cash transactions.'
  );
}

export function cashierInsufficientAmountMessage(): string {
  return translateFineractCode(
    INSUFFICIENT_CASHIER_AMOUNT_CODE,
    'The cashier does not have enough cash for this transaction.'
  );
}
