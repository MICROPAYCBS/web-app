/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { geolocationErrorMessage, roundGpsCoordinate } from './coordinates';

describe('roundGpsCoordinate', () => {
  it('rounds to eight decimal places', () => {
    assert.equal(roundGpsCoordinate(0.347596123456), 0.34759612);
    assert.equal(roundGpsCoordinate(32.582519876543), 32.58251988);
  });
});

describe('geolocationErrorMessage', () => {
  it('maps permission errors to user-facing copy', () => {
    const error = { code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError;
    assert.match(geolocationErrorMessage(error), /denied/i);
  });
});
