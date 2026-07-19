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
  findDepartmentByIdSegment,
  findOfficeByIdSegment,
  groupLegacyJournalEntryLines,
  isLegacyDepartmentIgnored,
  legacyCodesMatch,
  parseLegacyAmount,
  parseLegacyEffectiveDate,
  parseLegacyEntrySide,
  parseLegacyAccountNumber,
  parseLegacyIdSegment,
  resolveLegacyAccountNumber,
  validateLegacyJournalEntryGroup,
  validateLegacyJournalEntryGroups,
  type LegacyJournalEntryLineInput
} from './legacy-journal-entries-import';

describe('parseLegacyAccountNumber', () => {
  it('accepts exactly 10 digits and splits branch id, department id, and GL code', () => {
    const result = parseLegacyAccountNumber('1203456789');
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.value, {
      accountNumber: '1203456789',
      branchCode: '12',
      departmentCode: '03',
      glCode: '456789'
    });
    assert.equal(parseLegacyIdSegment(result.value.branchCode), 12);
    assert.equal(parseLegacyIdSegment(result.value.departmentCode), 3);
  });

  it('strips hyphens and other separators before validating', () => {
    const hyphenated = parseLegacyAccountNumber('12-03-456789');
    assert.equal(hyphenated.ok, true);
    if (!hyphenated.ok) {
      return;
    }
    assert.equal(hyphenated.value.accountNumber, '1203456789');
    assert.equal(hyphenated.value.branchCode, '12');
    assert.equal(hyphenated.value.departmentCode, '03');
    assert.equal(hyphenated.value.glCode, '456789');

    const spaced = parseLegacyAccountNumber('12 03 456789');
    assert.equal(spaced.ok, true);
    if (!spaced.ok) {
      return;
    }
    assert.equal(spaced.value.accountNumber, '1203456789');
  });

  it('rejects non-digit and wrong-length values', () => {
    assert.equal(parseLegacyAccountNumber('').ok, false);
    assert.equal(parseLegacyAccountNumber('120345678').ok, false);
    assert.equal(parseLegacyAccountNumber('12034567890').ok, false);
    assert.equal(parseLegacyAccountNumber('12AB456789').ok, false);
  });
});

describe('legacyCodesMatch', () => {
  it('matches numeric GL codes with or without leading zeros', () => {
    assert.equal(legacyCodesMatch('03', '3'), true);
    assert.equal(legacyCodesMatch('03', '03'), true);
    assert.equal(legacyCodesMatch('12', '13'), false);
  });
});

describe('resolveLegacyAccountNumber', () => {
  const offices = [
    { id: 12, name: 'Kampala' },
    { id: 1, name: 'Head Office' }
  ];
  const departments = [
    { id: 3, officeId: 12, departmentName: 'Ops' },
    { id: 3, officeId: 1, departmentName: 'duplicate id impossible' },
    { id: 11, officeId: 1, departmentName: 'HO Ops' },
    { id: 9, officeId: 12, departmentName: 'Closed', active: false }
  ];
  const glAccounts = [
    { id: 501, glCode: '456789', name: 'Expense' },
    { id: 200, glCode: '100001', name: 'Cash' }
  ];

  it('resolves office and department by numeric id segments, GL by code', () => {
    const result = resolveLegacyAccountNumber('1203456789', {
      offices,
      departments: [
        { id: 3, officeId: 12, departmentName: 'Ops' },
        { id: 11, officeId: 1, departmentName: 'HO Ops' }
      ],
      glAccounts
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.office.id, 12);
    assert.equal(result.value.department?.id, 3);
    assert.equal(result.value.glAccount.id, 501);
  });

  it('maps padded segments to ids (01 → 1)', () => {
    const result = resolveLegacyAccountNumber('0111456789', {
      offices,
      departments: [{ id: 11, officeId: 1, departmentName: 'HO Ops' }],
      glAccounts
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.office.id, 1);
    assert.equal(result.value.department?.id, 11);
  });

  it('ignores department when segment is 00', () => {
    assert.equal(isLegacyDepartmentIgnored('00'), true);

    const result = resolveLegacyAccountNumber('1200456789', {
      offices,
      departments: [{ id: 3, officeId: 12, departmentName: 'Ops' }],
      glAccounts
    });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.office.id, 12);
    assert.equal(result.value.department, undefined);
    assert.equal(result.value.glAccount.id, 501);
  });

  it('looks up entities by id segment', () => {
    assert.equal(findOfficeByIdSegment(offices, '01')?.id, 1);
    assert.equal(findDepartmentByIdSegment([{ id: 11, officeId: 1 }], '11', 1)?.id, 11);
  });

  it('fails when a segment cannot be resolved', () => {
    const unknownBranch = resolveLegacyAccountNumber('9903456789', {
      offices,
      departments: [{ id: 3, officeId: 12, departmentName: 'Ops' }],
      glAccounts
    });
    assert.equal(unknownBranch.ok, false);

    const unknownGl = resolveLegacyAccountNumber('1203999999', {
      offices,
      departments: [{ id: 3, officeId: 12, departmentName: 'Ops' }],
      glAccounts
    });
    assert.equal(unknownGl.ok, false);
  });
});
describe('parseLegacyEntrySide', () => {
  it('accepts DR/CR case-insensitively', () => {
    assert.deepEqual(parseLegacyEntrySide('dr'), { ok: true, value: 'DR' });
    assert.deepEqual(parseLegacyEntrySide('Cr'), { ok: true, value: 'CR' });
  });

  it('rejects other spellings', () => {
    assert.equal(parseLegacyEntrySide('Debit').ok, false);
    assert.equal(parseLegacyEntrySide('D').ok, false);
    assert.equal(parseLegacyEntrySide('').ok, false);
  });
});

describe('parseLegacyAmount', () => {
  it('accepts positive amounts', () => {
    assert.deepEqual(parseLegacyAmount('100.5'), { ok: true, value: 100.5 });
    assert.deepEqual(parseLegacyAmount(250), { ok: true, value: 250 });
  });

  it('rejects zero, negative, and invalid values', () => {
    assert.equal(parseLegacyAmount(0).ok, false);
    assert.equal(parseLegacyAmount('-1').ok, false);
    assert.equal(parseLegacyAmount('abc').ok, false);
  });
});

describe('legacy journal entry groups', () => {
  function line(
    patch: Partial<LegacyJournalEntryLineInput> &
      Pick<LegacyJournalEntryLineInput, 'rowNumber' | 'side' | 'amount' | 'reference' | 'effectiveDate'>
  ): LegacyJournalEntryLineInput {
    return {
      accountNumber: '1200456789',
      officeId: 1,
      glAccountId: 501,
      ...patch
    };
  }

  it('groups rows by effective date and reference', () => {
    const groups = groupLegacyJournalEntryLines([
      line({
        rowNumber: 2,
        side: 'DR',
        amount: 100,
        reference: 'INV-1',
        effectiveDate: '2026-07-11'
      }),
      line({
        rowNumber: 3,
        side: 'CR',
        amount: 100,
        reference: 'INV-1',
        effectiveDate: '2026-07-11',
        glAccountId: 200
      }),
      line({
        rowNumber: 4,
        side: 'DR',
        amount: 50,
        reference: 'INV-2',
        effectiveDate: '2026-07-11'
      })
    ]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0]?.lines.length, 2);
    assert.equal(groups[1]?.lines.length, 1);
  });

  it('requires balanced debit and credit totals per group', () => {
    const balanced = validateLegacyJournalEntryGroup({
      key: 'k',
      effectiveDate: '2026-07-11',
      reference: 'INV-1',
      lines: [
        line({
          rowNumber: 2,
          side: 'DR',
          amount: 100,
          reference: 'INV-1',
          effectiveDate: '2026-07-11'
        }),
        line({
          rowNumber: 3,
          side: 'CR',
          amount: 100,
          reference: 'INV-1',
          effectiveDate: '2026-07-11',
          glAccountId: 200
        })
      ]
    });
    assert.equal(balanced.length, 0);

    const issues = validateLegacyJournalEntryGroups([
      line({
        rowNumber: 2,
        side: 'DR',
        amount: 100,
        reference: 'INV-1',
        effectiveDate: '2026-07-11'
      }),
      line({
        rowNumber: 3,
        side: 'CR',
        amount: 40,
        reference: 'INV-1',
        effectiveDate: '2026-07-11',
        glAccountId: 200
      })
    ]);
    assert.equal(issues.length, 1);
    assert.match(issues[0]?.message ?? '', /Total debits must equal total credits/i);
  });

  it('requires at least one debit and one credit per group', () => {
    const issues = validateLegacyJournalEntryGroup({
      key: 'k',
      effectiveDate: '2026-07-11',
      reference: 'INV-1',
      lines: [
        line({
          rowNumber: 2,
          side: 'DR',
          amount: 100,
          reference: 'INV-1',
          effectiveDate: '2026-07-11'
        })
      ]
    });
    assert.equal(issues.some((issue) => /credit/i.test(issue.message)), true);
  });

  it('rejects mixed branches within the same date and reference', () => {
    const issues = validateLegacyJournalEntryGroup({
      key: 'k',
      effectiveDate: '2026-07-11',
      reference: 'INV-1',
      lines: [
        line({
          rowNumber: 2,
          side: 'DR',
          amount: 100,
          reference: 'INV-1',
          effectiveDate: '2026-07-11',
          officeId: 1
        }),
        line({
          rowNumber: 3,
          side: 'CR',
          amount: 100,
          reference: 'INV-1',
          effectiveDate: '2026-07-11',
          officeId: 2,
          glAccountId: 200
        })
      ]
    });
    assert.equal(issues.some((issue) => /same branch/i.test(issue.message)), true);
  });
});

describe('parseLegacyEffectiveDate', () => {
  it('normalizes common date inputs', () => {
    assert.deepEqual(parseLegacyEffectiveDate('2026-07-11'), {
      ok: true,
      value: '2026-07-11'
    });
    assert.equal(parseLegacyEffectiveDate('11/07/2026').ok, true);
    assert.equal(parseLegacyEffectiveDate('').ok, false);
  });

  it('accepts Excel Date cell values', () => {
    assert.deepEqual(parseLegacyEffectiveDate(new Date(2026, 6, 14)), {
      ok: true,
      value: '2026-07-14'
    });
  });
});