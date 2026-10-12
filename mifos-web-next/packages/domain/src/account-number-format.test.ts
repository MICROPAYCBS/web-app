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
  accountNumberPatternRuleIssues,
  buildAccountNumberFormatPreviewSearchParams,
  defaultPatternForAccountType,
  patternToSegments,
  segmentTokenOptionsForAccountType,
  segmentsToPattern,
  sequenceScopeAllowedForAccountType
} from './account-number-format';

describe('account-number-format', () => {
  it('round-trips segments to pattern and back', () => {
    const rows = [
      { token: 'officeCode', width: 3 },
      { token: 'productCode', width: 2 },
      { token: 'sequence', width: 9 },
      { token: 'checkDigit', width: 1 }
    ];
    const pattern = segmentsToPattern(rows);
    assert.equal(pattern, '{officeCode:3}{productCode:2}{sequence:9}{checkDigit:1}');
    assert.deepEqual(patternToSegments(pattern), rows);
  });

  it('returns defaults per account type id', () => {
    const savings = defaultPatternForAccountType(3);
    assert.ok(savings);
    assert.equal(savings.sequenceScope, 3);
    assert.equal(savings.checkDigitAlgorithm, 1);

    const client = defaultPatternForAccountType(1);
    assert.ok(client);
    assert.equal(client.sequenceScope, 2);
    assert.match(client.formatPattern, /\{clientTypeCode:1\}/);
  });

  it('builds preview query string with optional params', () => {
    const params = buildAccountNumberFormatPreviewSearchParams({
      accountType: 3,
      officeId: 1,
      productShortName: 'SV',
      formatPattern: '{officeCode:3}{productCode:2}{sequence:9}{checkDigit:1}',
      sequenceScope: 3,
      checkDigitAlgorithm: 1
    });
    assert.equal(params.get('accountType'), '3');
    assert.equal(params.get('officeId'), '1');
    assert.equal(params.get('productShortName'), 'SV');
    assert.equal(params.get('formatPattern'), '{officeCode:3}{productCode:2}{sequence:9}{checkDigit:1}');
    assert.equal(params.get('sequenceScope'), '3');
    assert.equal(params.get('checkDigitAlgorithm'), '1');
  });

  it('filters segment tokens for client account type', () => {
    const tokens = [
      'officeCode',
      'productCode',
      'clientTypeCode',
      'entityTypeCode',
      'sequence',
      'checkDigit'
    ];
    assert.deepEqual(segmentTokenOptionsForAccountType(1, tokens), [
      'officeCode',
      'clientTypeCode',
      'sequence',
      'checkDigit'
    ]);
    assert.deepEqual(segmentTokenOptionsForAccountType(3, tokens), [
      'officeCode',
      'productCode',
      'sequence',
      'checkDigit'
    ]);
  });

  it('restricts office+product sequence scope to product account types', () => {
    assert.equal(sequenceScopeAllowedForAccountType(1, 3), false);
    assert.equal(sequenceScopeAllowedForAccountType(3, 3), true);
  });

  it('rejects tokens, widths, check digits, and scope codes the server rejects', () => {
    const messages = (issues: { message: string }[]) => issues.map((issue) => issue.message);

    assert.ok(
      messages(
        accountNumberPatternRuleIssues({
          pattern: '{productCode:2}{sequence:4}',
          accountTypeId: 1,
          sequenceScope: 2
        })
      ).some((message) => message.includes('productCode'))
    );

    assert.ok(
      messages(
        accountNumberPatternRuleIssues({
          pattern: '{officeCode:3}{sequence:4}{checkDigit:1}{productCode:2}',
          accountTypeId: 2,
          sequenceScope: 3
        })
      ).some((message) => message.includes('check digit'))
    );

    assert.ok(
      messages(
        accountNumberPatternRuleIssues({
          pattern: '{officeCode:3}{productCode:2}{sequence:30}',
          accountTypeId: 2,
          sequenceScope: 3
        })
      ).some((message) => message.includes('33'))
    );

    assert.ok(
      messages(
        accountNumberPatternRuleIssues({
          pattern: '{productCode:2}{sequence:4}',
          accountTypeId: 3,
          sequenceScope: 2
        })
      ).some((message) => message.includes('office code'))
    );

    assert.ok(
      messages(
        accountNumberPatternRuleIssues({
          pattern: '{officeCode:3}{sequence:4}',
          accountTypeId: 6,
          sequenceScope: 3
        })
      ).some((message) => message.includes('product code'))
    );

    assert.equal(
      accountNumberPatternRuleIssues({
        pattern: '{officeCode:3}{clientTypeCode:1}{sequence:8}{checkDigit:1}',
        accountTypeId: 1,
        sequenceScope: 2
      }).length,
      0
    );
  });
});
