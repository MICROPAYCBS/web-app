/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { savingsProductDetailsStepSchema } from '@mifos/validation';
import {
  locateWizardField,
  omitWizardFieldErrors,
  placeWizardFieldErrors,
  wizardErrorSection,
  wizardServerFailureBanner,
  zodObjectFieldNames
} from './wizard-api-errors';

const sections = [
  wizardErrorSection('details', 'details', savingsProductDetailsStepSchema),
  {
    stepId: 'charges',
    prefix: 'charges',
    fields: ['chargeIds', 'charges']
  }
];

describe('wizard field errors', () => {
  it('reads object keys through a refinement wrapper', () => {
    assert.ok(zodObjectFieldNames(savingsProductDetailsStepSchema).includes('name'));
  });

  it('places a parameter on its step and leaves unknown parameters for the banner', () => {
    const placed = placeWizardFieldErrors(
      {
        name: 'Name is already in use.',
        dateFormat: 'Unsupported format.'
      },
      (field) => locateWizardField(sections, field),
      ['details', 'charges']
    );
    assert.deepEqual(placed.stepIds, ['details']);
    assert.equal(placed.byStep.details?.['details.name'], 'Name is already in use.');
    assert.equal(placed.unmapped.dateFormat, 'Unsupported format.');
    assert.equal(
      wizardServerFailureBanner('Validation errors exist.', { name: 'x', dateFormat: 'Unsupported format.' }, placed),
      'Unsupported format.'
    );
  });

  it('drops a server error after that field changes', () => {
    const cleared = omitWizardFieldErrors(
      { name: 'Name is already in use.', shortName: 'Too long.' },
      ['name']
    );
    assert.deepEqual(cleared, { shortName: 'Too long.' });
  });
});
