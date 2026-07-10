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
  buildFineractCommandBody,
  buildFineractNoteCommandBody
} from '@/lib/fineract/client-command-body';

describe('buildFineractNoteCommandBody', () => {
  it('omits locale and dateFormat', () => {
    assert.deepEqual(buildFineractNoteCommandBody('Return to submitted'), {
      note: 'Return to submitted'
    });
    assert.equal('locale' in buildFineractNoteCommandBody('x'), false);
    assert.equal('dateFormat' in buildFineractNoteCommandBody('x'), false);
  });

  it('returns an empty body when note is blank', () => {
    assert.deepEqual(buildFineractNoteCommandBody(''), {});
    assert.deepEqual(buildFineractNoteCommandBody('   '), {});
  });
});

describe('buildFineractCommandBody', () => {
  it('still adds locale and dateFormat for dated commands', () => {
    const body = buildFineractCommandBody({ rejectedOnDate: '01 July 2026' });
    assert.equal(body.locale, 'en');
    assert.equal(body.dateFormat, 'dd MMMM yyyy');
  });
});
