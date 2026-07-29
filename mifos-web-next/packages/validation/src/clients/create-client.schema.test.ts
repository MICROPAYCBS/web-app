/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CLIENT_ADDRESS_POSTAL_CODE_MAX_LENGTH,
  clientAddressEntrySchema,
  createClientSchema
} from './create-client.schema';
import { GENDER_FEMALE } from './gender';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from './legal-form';

const personFamilyMember = {
  firstName: 'John',
  lastName: 'Doe',
  relationshipId: 1,
  genderId: GENDER_FEMALE
};

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
    locale: 'en',
    familyMembers: [personFamilyMember]
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

  it('requires at least one next of kin for individual customers', () => {
    const result = createClientSchema.safeParse({
      ...personBase,
      familyMembers: [],
      clientIdentifiers: [
        { documentTypeId: 1, documentKey: 'CM123456', status: 'Active' as const }
      ]
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.issues.some(
          (issue) => issue.path[0] === 'familyMembers' && issue.message.includes('next of kin')
        )
      );
    }
  });

  it('accepts individual customers with one valid identifier and next of kin', () => {
    const result = createClientSchema.safeParse({
      ...personBase,
      clientIdentifiers: [
        { documentTypeId: 1, documentKey: 'CM123456', status: 'Active' as const }
      ]
    });
    assert.equal(result.success, true);
  });

  it('does not require identifiers or next of kin for entity customers', () => {
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
      clientIdentifiers: [],
      familyMembers: []
    });
    assert.equal(result.success, true);
  });
});

describe('clientAddressEntrySchema', () => {
  it('accepts Micropay geographic fields with empty postal code', () => {
    const result = clientAddressEntrySchema.safeParse({
      addressTypeId: 1,
      isActive: true,
      isPrimary: true,
      stateProvinceId: 10,
      city: 'Kampala',
      countyDistrict: 'Kampala Central',
      addressLine1: 'Central Division',
      addressLine2: 'Nakasero',
      townVillage: 'Kololo',
      street: 'Plot 1',
      countryId: 1
    });
    assert.equal(result.success, true);
  });

  it('accepts postal codes up to 20 characters', () => {
    const result = clientAddressEntrySchema.safeParse({
      postalCode: '12345-6789'
    });
    assert.equal(result.success, true);
  });

  it('rejects postal codes longer than 20 characters', () => {
    const tooLong = '1'.repeat(CLIENT_ADDRESS_POSTAL_CODE_MAX_LENGTH + 1);
    const result = clientAddressEntrySchema.safeParse({
      postalCode: tooLong
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.issues.some((issue) =>
          issue.message.includes('Postal code must be 20 characters or fewer')
        )
      );
    }
  });

  it('rejects district/city longer than 100 characters', () => {
    const result = clientAddressEntrySchema.safeParse({
      city: 'x'.repeat(101)
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.issues.some((issue) =>
          issue.message.includes('District must be 100 characters or fewer')
        )
      );
    }
  });
});
