import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME,
  type LoanRepaymentPolicySettings
} from '@/lib/fineract/loan-repayment-policy-paths';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';

export type { LoanRepaymentPolicySettings };

/** When the configuration row is absent, direct loan repayments are disabled. */
export async function getLoanRepaymentPolicySettings(): Promise<LoanRepaymentPolicySettings> {
  const config = await getGlobalConfigurationByName(ALLOW_DIRECT_LOAN_REPAYMENTS_CONFIG_NAME);
  return {
    allowDirectLoanRepayments: config?.enabled === true
  };
}
