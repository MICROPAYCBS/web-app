/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapOnboardingFieldsToClientContacts } from './onboarding-client-contacts';

describe('mapOnboardingFieldsToClientContacts', () => {
  const options = [
    { id: 1, typeCode: 'MOBILE', typeName: 'Mobile' },
    { id: 2, typeCode: 'EMAIL', typeName: 'Email' },
    { id: 5, typeCode: 'WHATSAPP', typeName: 'WhatsApp' }
  ];

  it('maps primary and alternative values onto Mobile and Email types', () => {
    const mapped = mapOnboardingFieldsToClientContacts(
      {
        mobileNo: '+256712345678',
        alternativeMobileNo: '+256700000001',
        emailAddress: 'a@example.com',
        alternativeEmailAddress: 'b@example.com'
      },
      options
    );

    assert.deepEqual(
      mapped.map((row) => ({
        contactTypeId: row.contactTypeId,
        contactValue: row.contactValue,
        primary: row.primary,
        sourceField: row.sourceField
      })),
      [
        {
          contactTypeId: 1,
          contactValue: '+256712345678',
          primary: true,
          sourceField: 'mobileNo'
        },
        {
          contactTypeId: 1,
          contactValue: '+256700000001',
          primary: false,
          sourceField: 'alternativeMobileNo'
        },
        {
          contactTypeId: 2,
          contactValue: 'a@example.com',
          primary: true,
          sourceField: 'emailAddress'
        },
        {
          contactTypeId: 2,
          contactValue: 'b@example.com',
          primary: false,
          sourceField: 'alternativeEmailAddress'
        }
      ]
    );
  });

  it('skips empty values and duplicate alternatives', () => {
    const mapped = mapOnboardingFieldsToClientContacts(
      {
        mobileNo: '+256712345678',
        alternativeMobileNo: '+256712345678',
        emailAddress: ' ',
        alternativeEmailAddress: 'b@example.com'
      },
      options
    );

    assert.deepEqual(
      mapped.map((row) => row.sourceField),
      ['mobileNo', 'alternativeEmailAddress']
    );
    assert.equal(mapped[1]?.primary, false);
  });

  it('falls back to type name matching when codes differ', () => {
    const mapped = mapOnboardingFieldsToClientContacts(
      {
        mobileNo: '+256712345678',
        emailAddress: 'a@example.com'
      },
      [
        { id: 10, typeCode: 'CELL_PRIMARY', typeName: 'Primary phone' },
        { id: 11, typeCode: 'MAIL', typeName: 'Work email' }
      ]
    );

    assert.equal(mapped[0]?.contactTypeId, 10);
    assert.equal(mapped[1]?.contactTypeId, 11);
  });
});
