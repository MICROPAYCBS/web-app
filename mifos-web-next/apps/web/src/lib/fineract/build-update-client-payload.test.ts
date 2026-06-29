/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GENDER_MALE, LEGAL_FORM_PERSON, type UpdateClientPayload } from '@mifos/validation';
import { buildUpdateClientPayload, hasUpdateClientChanges } from './build-update-client-payload';
import { EmptyUpdatePayloadError } from './partial-update-payload';

function personBase(overrides: Partial<UpdateClientPayload> = {}): UpdateClientPayload {
  return {
    legalFormId: LEGAL_FORM_PERSON,
    firstname: 'William',
    middlename: '',
    lastname: 'Lubwama',
    staffId: 4,
    externalId: '',
    mobileNo: '+256789456123',
    emailAddress: '',
    taxIdentificationNumber: '',
    alternativeMobileNo: '',
    alternativeEmailAddress: '',
    maritalStatusId: 1,
    submittedOnDate: '01 March 2024',
    active: true,
    activationDate: '15 June 2024',
    isStaff: false,
    dateFormat: 'dd MMMM yyyy',
    locale: 'en',
    ...overrides
  } as UpdateClientPayload;
}

describe('buildUpdateClientPayload', () => {
  it('throws when no fields changed', () => {
    const initial = personBase();
    assert.throws(
      () => buildUpdateClientPayload(initial, { initial }),
      EmptyUpdatePayloadError
    );
  });

  it('sends only changed scalar fields', () => {
    const initial = personBase();
    const current = personBase({ maritalStatusId: 2, mobileNo: '+256700000000' });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.deepEqual(Object.keys(payload).sort(), ['locale', 'maritalStatusId', 'mobileNo']);
    assert.equal(payload.maritalStatusId, 2);
    assert.equal(payload.mobileNo, '+256700000000');
    assert.equal(payload.locale, 'en');
    assert.equal(payload.activationDate, undefined);
    assert.equal(payload.active, undefined);
    assert.equal(payload.submittedOnDate, undefined);
  });

  it('always includes locale on update', () => {
    const initial = personBase();
    const current = personBase({ lastname: 'Mukasa' });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.equal(payload.locale, 'en');
    assert.equal(payload.lastname, 'Mukasa');
    assert.equal('dateFormat' in payload, false);
  });

  it('does not send active or activationDate when only other fields change', () => {
    const initial = personBase();
    const current = personBase({ genderId: GENDER_MALE, titleId: 2 });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.equal(payload.genderId, GENDER_MALE);
    assert.equal(payload.titleId, 2);
    assert.equal('active' in payload, false);
    assert.equal('activationDate' in payload, false);
  });

  it('sends activationDate with dateFormat when only activation date changes', () => {
    const initial = personBase();
    const current = personBase({ activationDate: '20 June 2024' });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.equal(payload.activationDate, '20 June 2024');
    assert.equal(payload.dateFormat, 'dd MMMM yyyy');
    assert.equal(payload.locale, 'en');
    assert.equal('active' in payload, false);
    assert.equal(payload.legalFormId, LEGAL_FORM_PERSON);
    assert.equal(payload.firstname, 'William');
    assert.equal(payload.lastname, 'Lubwama');
  });

  it('anchors legal form and name when only marital status changes', () => {
    const initial = personBase({ maritalStatusId: 1 });
    const current = personBase({ maritalStatusId: 2 });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.equal(payload.maritalStatusId, 2);
    assert.equal(payload.legalFormId, LEGAL_FORM_PERSON);
    assert.equal(payload.locale, 'en');
    assert.equal(payload.firstname, 'William');
    assert.equal(payload.lastname, 'Lubwama');
    assert.equal(payload.middlename, '');
    assert.equal('mobileNo' in payload, false);
  });

  it('anchors legal form and name when only title changes', () => {
    const initial = personBase({ titleId: 1 });
    const current = personBase({ titleId: 2 });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.equal(payload.titleId, 2);
    assert.equal(payload.legalFormId, LEGAL_FORM_PERSON);
    assert.equal(payload.locale, 'en');
    assert.equal(payload.firstname, 'William');
    assert.equal(payload.lastname, 'Lubwama');
    assert.equal('genderId' in payload, false);
  });

  it('clears optional string fields when emptied', () => {
    const initial = personBase({ emailAddress: 'will@example.com' });
    const current = personBase({ emailAddress: '' });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.equal(payload.emailAddress, '');
  });

  it('clears optional ids when unset', () => {
    const initial = personBase({ titleId: 2 });
    const current = personBase({ titleId: undefined });
    const payload = buildUpdateClientPayload(current, { initial });

    assert.equal(payload.titleId, null);
  });

  it('hasUpdateClientChanges is false when values match initial', () => {
    const initial = personBase();
    assert.equal(hasUpdateClientChanges(initial, { initial }), false);
  });

  it('hasUpdateClientChanges is true when a field differs', () => {
    const initial = personBase();
    const current = personBase({ lastname: 'Mukasa' });
    assert.equal(hasUpdateClientChanges(current, { initial }), true);
  });

  it('hasUpdateClientChanges returns false after reverting a field', () => {
    const initial = personBase();
    const edited = personBase({ lastname: 'Mukasa' });
    assert.equal(hasUpdateClientChanges(edited, { initial }), true);
    assert.equal(hasUpdateClientChanges(initial, { initial }), false);
  });
});
