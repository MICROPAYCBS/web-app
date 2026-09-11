/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractClientTemplate } from '@mifos/api-client';
import type { CreateClientDraft } from './types';
import { findFirstInvalidSaveProgressStep, validateKycCaptureStep } from './validation';

const template = {
  customerClassOptions: [
    {
      id: 7,
      classCode: 'IND',
      className: 'Individual',
      enforceCustPhoto: true,
      enforceCustSignature: true
    }
  ]
} as FineractClientTemplate;

const draft = {
  general: { customerClassId: 7 },
  kycPhoto: null,
  kycSignature: null
} as CreateClientDraft;

describe('validateKycCaptureStep', () => {
  it('requires staged photo and signature when the class enforces them', () => {
    const errors = validateKycCaptureStep(draft, template);
    assert.equal(errors.kycPhoto, 'Capture or upload a customer photo before saving.');
    assert.equal(errors.kycSignature, 'Draw or upload a customer signature before saving.');
  });

  it('blocks save when the role cannot attach a required photo', () => {
    const errors = validateKycCaptureStep(draft, template, { canCreateImage: false });
    assert.match(errors.kycPhoto ?? '', /cannot save a customer photo/);
  });
});

describe('findFirstInvalidSaveProgressStep', () => {
  it('sends Save draft back to the KYC step when captures are missing', () => {
    const invalid = findFirstInvalidSaveProgressStep(
      {
        ...draft,
        general: {
          legalFormId: 1,
          firstname: 'Ada',
          lastname: 'Lovelace',
          officeId: 1,
          submittedOnDate: '11 September 2026',
          customerClassId: 7
        }
      } as CreateClientDraft,
      template
    );
    assert.equal(invalid?.stepId, 'kyc-capture');
  });
});
