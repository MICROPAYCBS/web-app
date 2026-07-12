/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Pencil } from 'lucide-react';
import type { ClientActionsMenuEntry } from '@/lib/clients/client-actions-menu-config';
import {
  collapseMenuSeparators,
  filterClientActionsMenuItems
} from '@/lib/clients/filter-client-actions-menu';

describe('collapseMenuSeparators', () => {
  it('removes leading, trailing, and duplicate separators', () => {
    const entries: ClientActionsMenuEntry[] = [
      { kind: 'separator', id: 'a' },
      { kind: 'edit-panel', id: 'edit', label: 'Edit', icon: Pencil },
      { kind: 'separator', id: 'b' },
      { kind: 'separator', id: 'c' }
    ];

    assert.deepEqual(
      collapseMenuSeparators(entries).map((entry) => entry.id),
      ['edit']
    );
  });
});

describe('filterClientActionsMenuItems', () => {
  it('drops permission-gated rows instead of leaving gaps', () => {
    const entries: ClientActionsMenuEntry[] = [
      { kind: 'edit-panel', id: 'edit', label: 'Edit', icon: Pencil, permission: 'UPDATE_CLIENT' },
      { kind: 'separator', id: 'before-lifecycle' },
      {
        kind: 'sheet',
        id: 'activate',
        label: 'Activate',
        icon: Pencil,
        sheetId: 'activate',
        permission: { any: ['ACTIVATE_CLIENT'] }
      }
    ];

    const filtered = filterClientActionsMenuItems(entries, {
      user: { userId: 1, username: 'maker', officeId: 1, permissions: ['UPDATE_CLIENT'] },
      rbacEnabled: true
    });

    assert.deepEqual(
      filtered.map((entry) => entry.id),
      ['edit']
    );
  });
});
