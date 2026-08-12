/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FineractClient, FineractHttpError } from '@mifos/api-client';

describe('FineractClient unauthorized handling', () => {
  it('passes Fineract-Platform-Reason to onUnauthorized then throws', async () => {
    const seen: Array<{ status: number; platformReason?: string | null }> = [];
    const client = new FineractClient({
      baseUrl: 'https://example.test/api/v1/',
      tenantId: 'default',
      getAuthHeader: async () => 'Basic abc',
      onUnauthorized: (error) => {
        seen.push({ status: error.status, platformReason: error.platformReason });
      },
      fetch: async () =>
        new Response('Unauthorized', {
          status: 401,
          headers: { 'Fineract-Platform-Reason': 'session-superseded' }
        })
    });

    await assert.rejects(
      () => client.get('/clients'),
      (error: unknown) => {
        assert.ok(error instanceof FineractHttpError);
        assert.equal(error.status, 401);
        assert.equal(error.platformReason, 'session-superseded');
        return true;
      }
    );
    assert.deepEqual(seen, [{ status: 401, platformReason: 'session-superseded' }]);
  });

  it('does not call onUnauthorized for non-401 errors', async () => {
    let called = false;
    const client = new FineractClient({
      baseUrl: 'https://example.test/api/v1/',
      tenantId: 'default',
      getAuthHeader: async () => null,
      onUnauthorized: () => {
        called = true;
      },
      fetch: async () => new Response('{"defaultUserMessage":"nope"}', { status: 404 })
    });

    await assert.rejects(() => client.get('/missing'), FineractHttpError);
    assert.equal(called, false);
  });
});
