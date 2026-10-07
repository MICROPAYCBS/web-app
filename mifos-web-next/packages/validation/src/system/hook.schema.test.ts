/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateUpsertHookForm } from './hook.schema';

const webHook = {
  name: 'Web' as const,
  displayName: 'Customer created',
  isActive: true,
  contentType: 'json' as const,
  events: [{ entityName: 'CLIENT', actionName: 'CREATE' }]
};

describe('validateUpsertHookForm payload URL', () => {
  it('accepts an http address that ends with a slash', () => {
    const result = validateUpsertHookForm({
      ...webHook,
      payloadUrl: 'https://example.com/hooks/'
    });
    assert.equal(result.success, true);
  });

  it('rejects an address that does not end with a slash', () => {
    const result = validateUpsertHookForm({
      ...webHook,
      payloadUrl: 'https://example.com/hooks'
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0]?.message, 'End the payload URL with a slash (/).');
    }
  });

  it('rejects an address without http or https', () => {
    const result = validateUpsertHookForm({
      ...webHook,
      payloadUrl: 'example.com/hooks/'
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(
        result.error.issues[0]?.message,
        'Enter a full address starting with http:// or https://.'
      );
    }
  });
});
