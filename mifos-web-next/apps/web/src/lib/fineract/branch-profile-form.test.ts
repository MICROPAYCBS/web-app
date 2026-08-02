/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildOfficePayload } from '@/lib/fineract/build-office-payload';
import {
  branchProfileInputFromForm,
  defaultBranchProfileFormFields
} from '@/lib/fineract/branch-profile-form';

describe('branchProfileInputFromForm', () => {
  it('returns undefined when no profile fields are provided', () => {
    assert.equal(branchProfileInputFromForm(defaultBranchProfileFormFields()), undefined);
  });

  it('includes only filled fields and omits status unless selected', () => {
    const profile = branchProfileInputFromForm({
      ...defaultBranchProfileFormFields(),
      officeCode: '001',
      city: 'Kampala'
    });

    assert.deepEqual(profile, {
      officeCode: '001',
      city: 'Kampala'
    });
  });

  it('includes status when the user selects it', () => {
    const profile = branchProfileInputFromForm({
      ...defaultBranchProfileFormFields(),
      status: 'ACTIVE'
    });

    assert.deepEqual(profile, { status: 'ACTIVE' });
  });
});

describe('buildOfficePayload', () => {
  it('omits branchProfile for a minimal create', () => {
    const payload = buildOfficePayload({
      name: 'Head Office',
      parentId: 1,
      openingDate: '01 January 2026',
      externalId: '',
      dateFormat: 'dd MMMM yyyy',
      locale: 'en',
      branchProfile: undefined
    });

    assert.equal('branchProfile' in payload, false);
    assert.equal(payload.name, 'Head Office');
    assert.equal(payload.parentId, 1);
  });

  it('keeps only provided branchProfile fields', () => {
    const payload = buildOfficePayload({
      name: 'Service Centre',
      parentId: 1,
      openingDate: '01 January 2026',
      dateFormat: 'dd MMMM yyyy',
      locale: 'en',
      branchProfile: {
        officeCode: '001',
        city: 'Kampala',
        status: undefined,
        address: ''
      }
    });

    assert.deepEqual(payload.branchProfile, {
      officeCode: '001',
      city: 'Kampala'
    });
  });
});
