/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loanAccountActionVisibility } from '@/lib/fineract/loan-account-command-meta';

describe('loanAccountActionVisibility', () => {
  it('shows installment editing on pending variable-installment loans', () => {
    const visibility = loanAccountActionVisibility({
      isVariableInstallmentsAllowed: true,
      status: { value: 'Submitted and pending approval' }
    });
    assert.equal(visibility.editVariableInstallments, true);
    assert.equal(visibility.reschedule, false);
  });

  it('hides installment editing after approval', () => {
    const visibility = loanAccountActionVisibility({
      isVariableInstallmentsAllowed: true,
      status: { value: 'Approved' }
    });
    assert.equal(visibility.editVariableInstallments, false);
  });
});
