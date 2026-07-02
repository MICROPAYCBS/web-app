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
  abbreviateFineractBuildCommit,
  formatFineractBuildVersionLabel,
  parseFineractBuildVersion,
  resolveFineractBuildVersion
} from './fineract-build-version';

describe('parseFineractBuildVersion', () => {
  it('splits a trailing dash commit from SNAPSHOT releases', () => {
    assert.deepEqual(parseFineractBuildVersion('1.12.0-SNAPSHOT-abc1234'), {
      release: '1.12.0-SNAPSHOT',
      commit: 'abc1234'
    });
  });

  it('splits a trailing plus commit', () => {
    assert.deepEqual(parseFineractBuildVersion('1.12.0+abc1234567890abcdef'), {
      release: '1.12.0',
      commit: 'abc1234'
    });
  });

  it('returns release only when no commit suffix is present', () => {
    assert.deepEqual(parseFineractBuildVersion('1.12.0-SNAPSHOT'), {
      release: '1.12.0-SNAPSHOT'
    });
  });
});

describe('abbreviateFineractBuildCommit', () => {
  it('keeps 7-char abbreviations and truncates longer hashes', () => {
    assert.equal(abbreviateFineractBuildCommit('abc1234'), 'abc1234');
    assert.equal(abbreviateFineractBuildCommit('ABCDEF1234567890'), 'abcdef1');
  });

  it('returns undefined for non-string commit ids', () => {
    assert.equal(abbreviateFineractBuildCommit(undefined), undefined);
    assert.equal(abbreviateFineractBuildCommit(null), undefined);
    // Spring actuator may expose commit.id as an object — must not throw.
    assert.equal(
      abbreviateFineractBuildCommit({ abbrev: '5884cf4' } as unknown as string),
      undefined
    );
  });
});

describe('formatFineractBuildVersionLabel', () => {
  it('joins release and commit with plus', () => {
    assert.equal(
      formatFineractBuildVersionLabel({ release: '1.12.0-SNAPSHOT', commit: 'abc1234' }),
      '1.12.0-SNAPSHOT+abc1234'
    );
  });
});

describe('resolveFineractBuildVersion', () => {
  it('uses git.commit.id when build version has no suffix', () => {
    assert.deepEqual(
      resolveFineractBuildVersion({
        git: {
          build: { version: '1.12.0-SNAPSHOT' },
          commit: { id: 'fedcba9876543210abcdef1234567890abcd' }
        }
      }),
      { release: '1.12.0-SNAPSHOT', commit: 'fedcba9' }
    );
  });

  it('prefers commit suffix embedded in git.build.version', () => {
    assert.deepEqual(
      resolveFineractBuildVersion({
        git: {
          build: { version: '1.12.0-SNAPSHOT-abc1234' },
          commit: { id: 'ffffffffffffffffffffffffffffffffffffffff' }
        }
      }),
      { release: '1.12.0-SNAPSHOT', commit: 'abc1234' }
    );
  });

  it('reads nested Spring git.commit.id.abbrev objects', () => {
    assert.deepEqual(
      resolveFineractBuildVersion({
        git: {
          build: { version: '1.15.0-SNAPSHOT' },
          commit: {
            id: {
              abbrev: '5884cf4',
              full: '5884cf465d51b760da512deae6cb924a097e279b',
              describe: '1.14.0-1162-g5884cf4-dirty'
            }
          }
        }
      }),
      { release: '1.15.0-SNAPSHOT', commit: '5884cf4' }
    );
  });
});
