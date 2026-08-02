/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSmtpDeliveryConfigured } from '@/lib/fineract/smtp-delivery';

describe('isSmtpDeliveryConfigured', () => {
  it('returns false when host, port, or from email is missing', () => {
    assert.equal(isSmtpDeliveryConfigured([]), false);
    assert.equal(
      isSmtpDeliveryConfigured([
        { name: 'host', value: 'smtp.example.com' },
        { name: 'port', value: '587' }
      ]),
      false
    );
  });

  it('returns true when host, port, and from email are set', () => {
    assert.equal(
      isSmtpDeliveryConfigured([
        { name: 'host', value: 'smtp.example.com' },
        { name: 'port', value: '587' },
        { name: 'fromEmail', value: 'noreply@example.com' },
        { name: 'password', value: '' }
      ]),
      true
    );
  });
});
