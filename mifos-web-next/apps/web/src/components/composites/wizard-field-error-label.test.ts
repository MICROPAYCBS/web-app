/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cleanFieldLabelText, humanizeFieldKey } from './wizard-field-error-label';

describe('wizard field error labels', () => {
  it('turns a wizard path into a readable field name', () => {
    assert.equal(humanizeFieldKey('settings.overdueDaysForNPA'), 'Overdue days for NPA');
    assert.equal(humanizeFieldKey('settings.daysInYearType'), 'Days in year type');
    assert.equal(humanizeFieldKey('graceOnPrincipalPayment'), 'Grace on principal payment');
  });

  it('drops required and optional markers from a label', () => {
    assert.equal(cleanFieldLabelText('Overdue days for NPA *'), 'Overdue days for NPA');
    assert.equal(
      cleanFieldLabelText('Grace on principal payment (optional)'),
      'Grace on principal payment'
    );
    assert.equal(cleanFieldLabelText('   '), undefined);
  });
});
