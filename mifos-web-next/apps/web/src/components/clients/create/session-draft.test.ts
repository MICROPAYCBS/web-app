/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lookupErrorForCreateClientStep } from '../../../lib/fineract/create-client-wizard-lookups';
import { wizardDraftsEqual } from '../../../lib/wizard-session-draft';
import { sanitizeCreateClientSessionDraft } from './session-draft';
import type { CreateClientDraft } from './types';

describe('sanitizeCreateClientSessionDraft', () => {
  it('strips KYC captures so they are not written to sessionStorage', () => {
    const draft = {
      general: { firstname: 'Ada' },
      clientIdentifiers: [],
      familyMembers: [],
      incomeSources: [],
      contacts: [],
      complianceProfile: {},
      addresses: [],
      datatables: {},
      multiRowDatatables: {},
      kycPhoto: { file: {} as File, previewUrl: 'blob:photo' },
      kycSignature: { file: {} as File, previewUrl: 'blob:sig' }
    } as CreateClientDraft;

    const sanitized = sanitizeCreateClientSessionDraft(draft);
    assert.equal(sanitized.kycPhoto, undefined);
    assert.equal(sanitized.kycSignature, undefined);
    assert.equal(sanitized.general.firstname, 'Ada');
    assert.equal(
      wizardDraftsEqual(sanitizeCreateClientSessionDraft(draft), {
        ...draft,
        kycPhoto: undefined,
        kycSignature: undefined
      }),
      true
    );
  });
});

describe('lookupErrorForCreateClientStep', () => {
  it('maps identifier and address steps to lookup errors', () => {
    const errors = {
      identifiers: 'Could not load identifier options.',
      address: 'Could not load address fields.'
    };
    assert.equal(
      lookupErrorForCreateClientStep('identifiers', errors),
      'Could not load identifier options.'
    );
    assert.equal(lookupErrorForCreateClientStep('address', errors), 'Could not load address fields.');
    assert.equal(lookupErrorForCreateClientStep('biodata', errors), undefined);
  });
});
