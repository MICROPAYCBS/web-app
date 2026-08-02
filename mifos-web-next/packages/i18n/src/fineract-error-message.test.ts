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
  resolveFineractErrorItemMessage,
  sanitizeRawDatabaseErrorMessage
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

  it('maps password-email delivery failures to actionable copy', () => {
    const message = resolveFineractErrorItemMessage({
      parameterName: 'email',
      defaultUserMessage:
        'Sending email failed; is parameter email is invalid? More details available in server log: Connection refused',
      userMessageGlobalisationCode: 'error.msg.user.email.invalid'
    });
    assert.match(message ?? '', /password email/i);
    assert.doesNotMatch(message ?? '', /^email$/i);
    assert.doesNotMatch(message ?? '', /server log/i);
  });

  it('prefers developerMessage when defaultUserMessage is only a permission code', () => {
    assert.equal(
      resolveFineractErrorItemMessage({
        parameterName: 'ACTIVATE_SAVINGSACCOUNT',
        defaultUserMessage: 'ACTIVATE_SAVINGSACCOUNT',
        developerMessage:
          'The command ACTIVATE_SAVINGSACCOUNT is not supported. Can not be checked by the same user.',
        userMessageGlobalisationCode: 'error.msg.command.unsupported'
      }),
      'The command ACTIVATE_SAVINGSACCOUNT is not supported. Can not be checked by the same user.'
    );
  });

  it('maps Address max-length codes to Micropay field labels', () => {
    assert.equal(
      resolveFineractErrorItemMessage({
        parameterName: 'postalCode',
        defaultUserMessage: 'The parameter `postalCode` exceeds max length of 20.',
        userMessageGlobalisationCode: 'validation.msg.Address.postalCode.exceeds.max.length'
      }),
      'Postal code must be 20 characters or fewer.'
    );
    assert.equal(
      resolveFineractErrorItemMessage({
        parameterName: 'city',
        userMessageGlobalisationCode: 'validation.msg.Address.city.exceeds.max.length'
      }),
      'District must be 100 characters or fewer.'
    );
  });
});

describe('sanitizeRawDatabaseErrorMessage', () => {
  it('maps PostgreSQL syntax errors to user-safe copy', () => {
    assert.equal(
      sanitizeRawDatabaseErrorMessage('ERROR: syntax error at or near "$4" Position: 177'),
      'The server could not save the denomination breakdown. Confirm Fineract migrations 3063 and 3064 are applied, then check server logs for database errors.'
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

  it('joins multiple nested validation messages', () => {
    assert.equal(
      getFineractErrorMessage({
        defaultUserMessage: 'Validation errors exist.',
        userMessageGlobalisationCode: 'validation.msg.validation.errors.exist',
        errors: [
          {
            parameterName: 'customerClassId',
            defaultUserMessage: 'Customer class `Retail` requires a customer signature before activation.',
            userMessageGlobalisationCode: 'validation.msg.client.customerClassId.signature.required'
          },
          {
            parameterName: 'customerClassId',
            defaultUserMessage:
              'Customer class `Retail` requires at least one identification document before activation.',
            userMessageGlobalisationCode: 'validation.msg.client.customerClassId.document.required'
          }
        ]
      }),
      'Customer class `Retail` requires a customer signature before activation.\nCustomer class `Retail` requires at least one identification document before activation.'
    );
  });

  it('prefers a specific nested integrity message over the generic translation', () => {
    assert.equal(
      getFineractErrorMessage({
        defaultUserMessage: 'A data integrity issue occurred.',
        userMessageGlobalisationCode: 'error.msg.data.integrity.issue',
        errors: [
          {
            defaultUserMessage: 'Unknown data integrity issue with resource: duplicate key value',
            userMessageGlobalisationCode: 'error.msg.data.integrity.issue'
          }
        ]
      }),
      'Unknown data integrity issue with resource: duplicate key value'
    );
  });

  it('uses the first nested error when a single nested error is returned', () => {
    assert.equal(
      getFineractErrorMessage({
        errors: [{ defaultUserMessage: 'First problem' }]
      }),
      'First problem'
    );
  });

  it('returns a helpful 403 fallback when body is empty', () => {
    assert.equal(
      getFineractErrorMessage(null, 403),
      'You do not have permission to perform this action.'
    );
  });

  it('prefers translated compliance profile codes over generic Fineract text', () => {
    assert.equal(
      getFineractErrorMessage({
        defaultUserMessage: 'Validation errors exist.',
        userMessageGlobalisationCode: 'validation.msg.validation.errors.exist',
        errors: [
          {
            parameterName: 'otherBankAccounts',
            defaultUserMessage: 'Failed data validation due to: required.when.has.other.bank.accounts.is.true.',
            userMessageGlobalisationCode:
              'validation.msg.ComplianceProfile.otherBankAccounts.required.when.has.other.bank.accounts.is.true'
          }
        ]
      }),
      'Add at least one complete other bank account when this option is selected.'
    );
  });

  it('skips generic top-level text when nested errors carry specifics', () => {
    assert.equal(
      getFineractErrorMessage({
        defaultUserMessage: 'Insufficient privileges to perform this action.',
        userMessageGlobalisationCode: 'error.msg.not.authorized',
        errors: [
          {
            parameterName: 'id',
            defaultUserMessage: 'User has no authority to: UPDATE_COMPLIANCEPROFILE'
          }
        ]
      }),
      'User has no authority to: UPDATE_COMPLIANCEPROFILE'
    );
  });

  it('sanitizes leaked PostgreSQL syntax errors', () => {
    assert.equal(
      getFineractErrorMessage({
        developerMessage: 'ERROR: syntax error at or near "$4" Position: 177'
      }),
      'The server could not save the denomination breakdown. Confirm Fineract migrations 3063 and 3064 are applied, then check server logs for database errors.'
    );
  });

  it('surfaces unsupported checker command details instead of the permission code', () => {
    assert.equal(
      getFineractErrorMessage({
        defaultUserMessage: 'Validation errors exist.',
        userMessageGlobalisationCode: 'validation.msg.validation.errors.exist',
        errors: [
          {
            parameterName: 'ACTIVATE_SAVINGSACCOUNT',
            defaultUserMessage: 'ACTIVATE_SAVINGSACCOUNT',
            developerMessage:
              'The command ACTIVATE_SAVINGSACCOUNT is not supported. Can not be checked by the same user.',
            userMessageGlobalisationCode: 'error.msg.command.unsupported'
          }
        ]
      }),
      'The command ACTIVATE_SAVINGSACCOUNT is not supported. Can not be checked by the same user.'
    );
  });
});
