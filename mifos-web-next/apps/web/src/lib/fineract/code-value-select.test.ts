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
  codeValueSelectEmptyMessage,
  codeValueSelectHint
} from './code-value-select';

describe('codeValueSelectHint', () => {
  it('names the lookup code and where to manage values', () => {
    const hint = codeValueSelectHint('SavingsTransactionFreezeReasons');
    assert.match(hint, /SavingsTransactionFreezeReasons/);
    assert.match(hint, /Administration → Codes/);
  });
});

describe('codeValueSelectEmptyMessage', () => {
  it('names the lookup code when no options exist', () => {
    const message = codeValueSelectEmptyMessage('SavingsAccountBlockReasons');
    assert.match(message, /SavingsAccountBlockReasons/);
    assert.match(message, /Administration → Codes/);
  });
});
