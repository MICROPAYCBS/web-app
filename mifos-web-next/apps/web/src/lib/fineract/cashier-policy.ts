import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  CAPTURE_LEGAL_TENDER_FOR_CASH_TRANSACTIONS_CONFIG_NAME,
  PREVENT_CASHIER_OVERDRAW_CONFIG_NAME,
  REQUIRE_CASHIER_FOR_CASH_TRANSACTIONS_CONFIG_NAME,
  type CashierPolicySettings,
  type LegalTenderCaptureMode
} from '@/lib/fineract/cashier-policy-paths';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';

export type { CashierPolicySettings, LegalTenderCaptureMode };

function parseLegalTenderCaptureMode(
  stringValue: string | null | undefined,
  enabled: boolean | undefined
): LegalTenderCaptureMode {
  if (enabled === false) {
    return 'OFF';
  }
  const normalized = stringValue?.trim().toUpperCase();
  if (normalized === 'OFF' || normalized === 'REQUIRED' || normalized === 'OPTIONAL') {
    return normalized;
  }
  return 'OPTIONAL';
}

/** Matches Fineract migration defaults when configuration rows are absent. */
export async function getCashierPolicySettings(): Promise<CashierPolicySettings> {
  const [preventOverdraw, requireCashier, captureLegalTender] = await Promise.all([
    getGlobalConfigurationByName(PREVENT_CASHIER_OVERDRAW_CONFIG_NAME),
    getGlobalConfigurationByName(REQUIRE_CASHIER_FOR_CASH_TRANSACTIONS_CONFIG_NAME),
    getGlobalConfigurationByName(CAPTURE_LEGAL_TENDER_FOR_CASH_TRANSACTIONS_CONFIG_NAME)
  ]);

  return {
    preventCashierOverdraw: preventOverdraw?.enabled ?? true,
    requireCashierForCashTransactions: requireCashier?.enabled ?? true,
    captureLegalTenderForCashTransactions: parseLegalTenderCaptureMode(
      captureLegalTender?.stringValue,
      captureLegalTender?.enabled
    )
  };
}
