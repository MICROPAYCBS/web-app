/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractClientEditData } from '@mifos/api-client';
import { LEGAL_FORM_PERSON } from '@mifos/validation';
import { mapClientToEditFormInput } from './client-edit-map';

function baseClient(overrides: Partial<FineractClientEditData> = {}): FineractClientEditData {
  return {
    id: 1,
    accountNo: '000001',
    status: { id: 300, code: 'clientStatusType.active', value: 'Active' },
    active: true,
    legalForm: { id: LEGAL_FORM_PERSON, code: 'legalFormType.person', value: 'Person' },
    firstname: 'William',
    lastname: 'Lubwama',
    ...overrides
  } as FineractClientEditData;
}

describe('mapClientToEditFormInput', () => {
  it('maps activation date from timeline array', () => {
    const form = mapClientToEditFormInput(
      baseClient({
        timeline: {
          submittedOnDate: [2024, 3, 1],
          activatedOnDate: [2024, 6, 15]
        }
      })
    );
    assert.equal(form.active, true);
    assert.equal(form.activationDate, '15 June 2024');
    assert.equal(form.submittedOnDate, '01 March 2024');
  });

  it('maps activation date from object-shaped API dates', () => {
    const form = mapClientToEditFormInput(
      baseClient({
        active: undefined,
        timeline: {
          submittedOnDate: [2024, 3, 1],
          activatedOnDate: { year: 2024, month: 6, day: 15 } as never
        }
      })
    );
    assert.equal(form.active, true);
    assert.equal(form.activationDate, '15 June 2024');
  });

  it('falls back to top-level activationDate', () => {
    const form = mapClientToEditFormInput(
      baseClient({
        activationDate: [2025, 1, 20],
        timeline: { submittedOnDate: [2024, 3, 1] }
      })
    );
    assert.equal(form.activationDate, '20 January 2025');
  });
});
