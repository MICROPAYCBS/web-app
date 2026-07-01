/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CheckerInboxListItem } from '@mifos/api-client';
import {
  applyCheckerInboxClientFilters,
  buildCheckerInboxClientFilterOptions
} from './client-filters';

const sampleItems: CheckerInboxListItem[] = [
  {
    id: 1,
    maker: 'App Administrator',
    actionName: 'CREATE',
    entityName: 'SAVINGSACCOUNT',
    processingResult: 'Awaiting Approval',
    resourceId: 42,
    madeOnDate: [2026, 7, 1, 10, 30, 0]
  },
  {
    id: 2,
    maker: 'Branch User',
    actionName: 'UPDATE',
    entityName: 'CLIENT',
    processingResult: 'Awaiting Approval',
    resourceId: 7,
    madeOnDate: [2026, 6, 15]
  }
];

describe('buildCheckerInboxClientFilterOptions', () => {
  it('derives unique sorted values from loaded rows', () => {
    const options = buildCheckerInboxClientFilterOptions(sampleItems);
    assert.deepEqual(options.makers, ['App Administrator', 'Branch User']);
    assert.deepEqual(options.actionNames, ['CREATE', 'UPDATE']);
    assert.deepEqual(options.entityNames, ['CLIENT', 'SAVINGSACCOUNT']);
    assert.deepEqual(options.processingResults, ['Awaiting Approval']);
  });
});

describe('applyCheckerInboxClientFilters', () => {
  it('filters by user, action, and entity', () => {
    const filtered = applyCheckerInboxClientFilters(sampleItems, {
      maker: 'Branch User',
      actionName: 'UPDATE',
      entityName: 'CLIENT'
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, 2);
  });

  it('filters by partial id and resource id', () => {
    const byId = applyCheckerInboxClientFilters(sampleItems, { id: '1' });
    assert.deepEqual(
      byId.map((item) => item.id),
      [1]
    );

    const byResource = applyCheckerInboxClientFilters(sampleItems, { resourceId: '4' });
    assert.deepEqual(
      byResource.map((item) => item.id),
      [1]
    );
  });
});
