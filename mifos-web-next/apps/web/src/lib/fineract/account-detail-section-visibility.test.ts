/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAccountPermissionedSectionVisible } from './account-detail-section-visibility';

describe('isAccountPermissionedSectionVisible', () => {
  it('hides audit and journal entries without permission', () => {
    assert.equal(isAccountPermissionedSectionVisible('audit', {}), false);
    assert.equal(isAccountPermissionedSectionVisible('journalEntries', {}), false);
    assert.equal(isAccountPermissionedSectionVisible('summary', {}), true);
  });

  it('shows audit and journal entries when allowed', () => {
    assert.equal(
      isAccountPermissionedSectionVisible('audit', { canViewAudits: true }),
      true
    );
    assert.equal(
      isAccountPermissionedSectionVisible('journalEntries', { canViewJournals: true }),
      true
    );
  });
});
