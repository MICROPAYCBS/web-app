/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createClientSchema } from './create-client.schema';
import { GENDER_FEMALE } from './gender';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from './legal-form';

describe('createClientSchema clientIdentifiers', () => {
  const personBase = {
    officeId: 1,
    staffId: 1,
    legalFormId: LEGAL_FORM_PERSON,
    firstname: 'Jane',
    lastname: 'Doe',
    mobileNo: '+256700000000',
    customerClassId: 1,
    genderId: GENDER_FEMALE,
    nationalityCountryId: 1,
    maritalStatusId: 1,
    dateOfBirth: '01 January 1990',
    submittedOnDate: '01 July 2026',
    dateFormat: 'dd MMMM yyyy',
    locale: 'en'
  };

  it('requires at least one identifier for individual customers', () => {
    const result = createClientSchema.safeParse({
      ...personBase,
      clientIdentifiers: []
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.issues.some(
          (issue) => issue.path[0] === 'clientIdentifiers' && issue.message.includes('required')
        )
      );
    }
  });

  it('accepts individual customers with one valid identifier', () => {
    const result = createClientSchema.safeParse({
      ...personBase,
      clientIdentifiers: [
        { documentTypeId: 1, documentKey: 'CM123456', status: 'Active' as const }
      ]
    });
    assert.equal(result.success, true);
  });

  it('does not require identifiers for entity customers', () => {
    const result = createClientSchema.safeParse({
      officeId: 1,
      staffId: 1,
      legalFormId: LEGAL_FORM_ENTITY,
      fullname: 'Acme Ltd',
      mobileNo: '+256700000000',
      customerClassId: 1,
      dateOfBirth: '01 January 2020',
      submittedOnDate: '01 July 2026',
      dateFormat: 'dd MMMM yyyy',
      locale: 'en',
      clientNonPersonDetails: {
        constitutionId: 1
      },
      clientIdentifiers: []
    });
    assert.equal(result.success, true);
  });
});
