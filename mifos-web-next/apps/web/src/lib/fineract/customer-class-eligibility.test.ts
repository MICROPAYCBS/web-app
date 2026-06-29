/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEGAL_FORM_PERSON } from '@mifos/validation';
import {
  getCustomerClassActivationIssues,
  type CustomerClassActivationClientState
} from './customer-class-eligibility';

const baseClass = {
  id: 1,
  classCode: 'RETAIL',
  className: 'Retail',
  legalFormId: LEGAL_FORM_PERSON
};

const completeClient: CustomerClassActivationClientState = {
  legalFormId: LEGAL_FORM_PERSON,
  dateOfBirth: '1990-01-15',
  customerRiskProfile: { id: 1, code: 'LOW' },
  hasProfileImage: true,
  hasSignature: true,
  identifierCount: 1,
  complianceProfile: {
    isPep: false,
    usCitizenOrResident: false,
    dpfAlternativeBankName: 'Not applicable'
  }
};

describe('getCustomerClassActivationIssues', () => {
  it('returns no issues when class has no enforcement rules', () => {
    assert.deepEqual(getCustomerClassActivationIssues(baseClass, {}), []);
  });

  it('requires a profile photo when enforceCustPhoto is set', () => {
    const issues = getCustomerClassActivationIssues(
      { ...baseClass, enforceCustPhoto: true },
      { hasProfileImage: false }
    );
    assert.equal(issues.length, 1);
    assert.match(issues[0]?.message ?? '', /profile photo/i);
  });

  it('requires a signature when enforceCustSignature is set', () => {
    const issues = getCustomerClassActivationIssues(
      { ...baseClass, enforceCustSignature: true },
      { hasSignature: false }
    );
    assert.match(issues[0]?.message ?? '', /signature/i);
  });

  it('requires identification when enforceCustDocument is set', () => {
    const issues = getCustomerClassActivationIssues(
      { ...baseClass, enforceCustDocument: true },
      { identifierCount: 0 }
    );
    assert.match(issues[0]?.message ?? '', /identification document/i);
  });

  it('collects multiple missing requirements', () => {
    const issues = getCustomerClassActivationIssues(
      {
        ...baseClass,
        enforceCustPhoto: true,
        enforceCustSignature: true,
        enforceCustDocument: true
      },
      { hasProfileImage: false, hasSignature: false, identifierCount: 0 }
    );
    assert.equal(issues.length, 3);
  });

  it('requires date of birth for age-restricted person classes', () => {
    const issues = getCustomerClassActivationIssues(
      { ...baseClass, minAge: 18 },
      { legalFormId: LEGAL_FORM_PERSON }
    );
    assert.match(issues[0]?.message ?? '', /date of birth/i);
  });

  it('requires a risk profile when the class defines a risk level', () => {
    const issues = getCustomerClassActivationIssues(
      { ...baseClass, riskLevel: 'LOW' },
      { legalFormId: LEGAL_FORM_PERSON }
    );
    assert.match(issues[0]?.message ?? '', /risk profile/i);
  });

  it('flags risk profile mismatch', () => {
    const issues = getCustomerClassActivationIssues(
      { ...baseClass, riskLevel: 'HIGH' },
      {
        customerRiskProfile: { id: 2, code: 'LOW' }
      }
    );
    assert.match(issues[0]?.message ?? '', /risk profile/i);
  });

  it('requires a compliance profile when enhanced due diligence is enabled', () => {
    const issues = getCustomerClassActivationIssues(
      { ...baseClass, enhancedDueDiligence: true },
      {}
    );
    assert.match(issues[0]?.message ?? '', /compliance profile/i);
  });

  it('passes when all class requirements are satisfied', () => {
    assert.deepEqual(
      getCustomerClassActivationIssues(
        {
          ...baseClass,
          enforceCustPhoto: true,
          enforceCustSignature: true,
          enforceCustDocument: true,
          riskLevel: 'LOW',
          enhancedDueDiligence: true,
          minAge: 18,
          maxAge: 65
        },
        completeClient
      ),
      []
    );
  });
});
