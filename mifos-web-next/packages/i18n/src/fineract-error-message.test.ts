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
  getFineractErrorMessage,
  normalizeFineractMessage,
  resolveFineractErrorItemMessage
} from './fineract-error-message';

describe('normalizeFineractMessage', () => {
  it('unescapes dotted field names', () => {
    assert.equal(
      normalizeFineractMessage('The parameter dateOfBirth is not supported'),
      'The parameter dateOfBirth is not supported'
    );
    assert.equal(normalizeFineractMessage('Activation\\.date is invalid'), 'Activation.date is invalid');
  });
});

describe('resolveFineractErrorItemMessage', () => {
  it('prefers defaultUserMessage over globalisation code', () => {
    assert.equal(
      resolveFineractErrorItemMessage({
        defaultUserMessage: 'Office with identifier 1 does not exist',
        userMessageGlobalisationCode: 'error.msg.office.id.invalid'
      }),
      'Office with identifier 1 does not exist'
    );
  });

  it('falls back to developerMessage', () => {
    assert.equal(
      resolveFineractErrorItemMessage({
        developerMessage: 'Validation failed for argument'
      }),
      'Validation failed for argument'
    );
  });
});

describe('getFineractErrorMessage', () => {
  it('uses nested validation message when top-level is generic', () => {
    assert.equal(
      getFineractErrorMessage({
        defaultUserMessage: 'Validation errors exist.',
        userMessageGlobalisationCode: 'validation.msg.validation.errors.exist',
        errors: [
          {
            parameterName: 'mobileNo',
            defaultUserMessage: 'Mobile number must be 10 digits',
            userMessageGlobalisationCode: 'validation.msg.client.mobileNo.invalid'
          }
        ]
      }),
      'Mobile number must be 10 digits'
    );
  });

  it('prefers the first nested error over a generic top-level message', () => {
    assert.equal(
      getFineractErrorMessage({
        defaultUserMessage: 'The request was invalid',
        errors: [
          {
            defaultUserMessage: 'Submitted date cannot be in the future'
          }
        ]
      }),
      'Submitted date cannot be in the future'
    );
  });

  it('uses the first nested error when several are returned', () => {
    assert.equal(
      getFineractErrorMessage({
        errors: [
          { defaultUserMessage: 'First problem' },
          { defaultUserMessage: 'Second problem' }
        ]
      }),
      'First problem'
    );
  });

  it('returns HTTP status when body is empty', () => {
    assert.equal(getFineractErrorMessage(null, 403), 'HTTP 403');
  });
});
