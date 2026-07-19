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
  buildUpdateCustomerClassPayload,
  EmptyUpdatePayloadError,
  hasUpdateCustomerClassChanges,
  LEGAL_FORM_PERSON,
  type UpdateCustomerClassPayload
} from '@mifos/validation';

function customerClassBase(
  overrides: Partial<UpdateCustomerClassPayload> = {}
): UpdateCustomerClassPayload {
  return {
    classCode: 'RETAIL',
    className: 'Retail',
    description: 'Standard retail class',
    legalFormId: LEGAL_FORM_PERSON,
    customerType: 'INDIVIDUAL',
    riskLevel: 'LOW',
    kycLevel: 'BASIC',
    loanEligible: true,
    restrictionId: undefined,
    overdraftAllowed: false,
    enhancedDueDiligence: false,
    reclassificationAllowed: true,
    minAge: 18,
    maxAge: 65,
    enforceCustPhoto: true,
    enforceCustSignature: true,
    enforceCustDocument: true,
    autoCreateAccount: false,
    status: 'ACTIVE',
    ...overrides
  };
}

describe('customer class partial PUT', () => {
  it('throws when no fields changed', () => {
    const initial = customerClassBase();
    assert.throws(
      () => buildUpdateCustomerClassPayload(initial, { initial }),
      EmptyUpdatePayloadError
    );
  });

  it('sends only changed fields', () => {
    const initial = customerClassBase();
    const current = customerClassBase({ className: 'Retail premium', riskLevel: 'HIGH' });
    const payload = buildUpdateCustomerClassPayload(current, { initial });

    assert.deepEqual(Object.keys(payload).sort(), ['className', 'riskLevel']);
    assert.equal(payload.className, 'Retail premium');
    assert.equal(payload.riskLevel, 'HIGH');
  });

  it('clears optional fields with null', () => {
    const initial = customerClassBase({ description: 'Notes', customerType: 'INDIVIDUAL' });
    const current = customerClassBase({ description: undefined, customerType: undefined });
    const payload = buildUpdateCustomerClassPayload(current, { initial });

    assert.equal(payload.description, null);
    assert.equal(payload.customerType, null);
  });

  it('hasUpdateCustomerClassChanges tracks dirty state', () => {
    const initial = customerClassBase();
    const edited = customerClassBase({ kycLevel: 'ENHANCED' });
    assert.equal(hasUpdateCustomerClassChanges(initial, { initial }), false);
    assert.equal(hasUpdateCustomerClassChanges(edited, { initial }), true);
    assert.equal(hasUpdateCustomerClassChanges(initial, { initial }), false);
  });
});
