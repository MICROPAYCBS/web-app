/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportRunParameter,
  FineractReportRunResult
} from '@mifos/api-client';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFinancialStatement,
  financialStatementFileName,
  financialStatementOfficeLabel,
  financialStatementPeriodLabel,
  financialStatementToCsv,
  parseStatementAmount
} from '@/lib/fineract/financial-statement';

function reportResult(
  headers: Array<[string, string]>,
  rows: unknown[][]
): FineractReportRunResult {
  return {
    columnHeaders: headers.map(([columnName, columnType]) => ({ columnName, columnType })),
    data: rows.map((row) => ({ row }))
  };
}

const periodParameters: FineractReportRunParameter[] = [
  {
    parameterName: 'endDateSelect',
    parameterVariable: 'endDate',
    parameterDisplayType: 'date'
  },
  {
    parameterName: 'startDateSelect',
    parameterVariable: 'startDate',
    parameterDisplayType: 'date'
  },
  {
    parameterName: 'OfficeIdSelectOne',
    parameterVariable: 'officeId',
    parameterLabel: 'Office'
  }
];

describe('parseStatementAmount', () => {
  it('sums grouped and parenthesised amounts without binary float drift', () => {
    const total = parseStatementAmount('1,000.10')
      .plus(parseStatementAmount('(0.20)'))
      .plus(parseStatementAmount('0.10'));
    assert.equal(total.toFixed(2), '1000.00');
  });
});

describe('buildFinancialStatement', () => {
  it('groups a balance sheet and keeps unknown groups in encounter order', () => {
    const built = buildFinancialStatement({
      slug: 'balance-sheet',
      organisationName: 'Acme SACCO',
      result: reportResult(
        [
          ['Type', 'string'],
          ['GL Code', 'string'],
          ['Account name', 'string'],
          ['Balance', 'decimal'],
          ['Currency', 'string']
        ],
        [
          ['Liability', '2000', 'Members', '40.00', 'ugx'],
          ['Suspense', '9000', 'Clearing', '5.00', 'UGX'],
          ['Asset', '1002', 'Bank', '70.00', 'UGX'],
          ['Assets', '1001', 'Cash', '30.10', 'UGX'],
          ['Contra', '9100', 'Offset', '1.00', 'UGX']
        ]
      )
    });

    assert.equal(built.ok, true);
    if (!built.ok) {
      return;
    }
    assert.equal(built.statement.title, 'Balance sheet');
    assert.equal(built.statement.organisationName, 'Acme SACCO');
    assert.equal(built.statement.currencyCode, 'UGX');
    assert.deepEqual(
      built.statement.lines.map((line) => [line.kind, line.label, line.amountLabel ?? '']),
      [
        ['section', 'Assets', ''],
        ['line', '1001 — Cash', 'UGX 30.10'],
        ['line', '1002 — Bank', 'UGX 70.00'],
        ['total', 'Total Assets', 'UGX 100.10'],
        ['section', 'Liability', ''],
        ['line', '2000 — Members', 'UGX 40.00'],
        ['total', 'Total Liability', 'UGX 40.00'],
        ['section', 'Suspense', ''],
        ['line', '9000 — Clearing', 'UGX 5.00'],
        ['total', 'Total Suspense', 'UGX 5.00'],
        ['section', 'Contra', ''],
        ['line', '9100 — Offset', 'UGX 1.00'],
        ['total', 'Total Contra', 'UGX 1.00']
      ]
    );
  });

  it('adds income statement net surplus from income minus expense', () => {
    const built = buildFinancialStatement({
      slug: 'income-statement',
      result: reportResult(
        [
          ['Income or expense', 'string'],
          ['Code', 'string'],
          ['Name', 'string'],
          ['Amount', 'decimal']
        ],
        [
          ['Expense', '5001', 'Rent', '40.00'],
          ['Revenue', '4001', 'Interest', '100.00'],
          ['Income', '4002', 'Fees', '50.25']
        ]
      )
    });

    assert.equal(built.ok, true);
    if (!built.ok) {
      return;
    }
    const surplus = built.statement.lines.find((line) => line.kind === 'surplus');
    assert.equal(surplus?.label, 'Net surplus / (deficit)');
    assert.equal(surplus?.amountLabel, '110.25');
    assert.deepEqual(
      built.statement.lines.filter((line) => line.kind === 'total').map((line) => line.amountLabel),
      ['150.25', '40.00']
    );
  });

  it('flags a trial balance whose debits and credits differ', () => {
    const built = buildFinancialStatement({
      slug: 'trial-balance',
      result: reportResult(
        [
          ['GL Code', 'string'],
          ['Account', 'string'],
          ['Debit', 'decimal'],
          ['Credit', 'decimal']
        ],
        [
          ['1000', 'Cash', '80.00', '0'],
          ['2000', 'Members', '0', '55.00']
        ]
      )
    });

    assert.equal(built.ok, true);
    if (!built.ok) {
      return;
    }
    assert.equal(built.statement.layout, 'debit-credit');
    assert.equal(built.statement.imbalanceNote, 'Debits and credits differ by 25.00.');
    const total = built.statement.lines.find((line) => line.kind === 'total');
    assert.equal(total?.debitLabel, '80.00');
    assert.equal(total?.creditLabel, '55.00');
  });

  it('omits the imbalance note when the trial balance agrees', () => {
    const built = buildFinancialStatement({
      slug: 'trial-balance',
      result: reportResult(
        [
          ['Account', 'string'],
          ['Closing Debit', 'decimal'],
          ['Closing Credit', 'decimal'],
          ['Debit', 'decimal'],
          ['Credit', 'decimal']
        ],
        [['Cash', '10.00', '10.00', '1.00', '0']]
      )
    });

    assert.equal(built.ok, true);
    if (!built.ok) {
      return;
    }
    assert.equal(built.statement.imbalanceNote, undefined);
    const line = built.statement.lines.find((entry) => entry.kind === 'line');
    assert.equal(line?.debitLabel, '10.00');
    assert.equal(line?.creditLabel, '10.00');
  });

  it('falls back when statement columns cannot be detected', () => {
    const missingCategory = buildFinancialStatement({
      slug: 'balance-sheet',
      result: reportResult(
        [
          ['GL Code', 'string'],
          ['Account name', 'string'],
          ['Balance', 'decimal']
        ],
        [['1000', 'Cash', '10']]
      )
    });
    const missingCredit = buildFinancialStatement({
      slug: 'trial-balance',
      result: reportResult(
        [
          ['Account', 'string'],
          ['Debit', 'decimal']
        ],
        [['Cash', '10']]
      )
    });

    assert.deepEqual(missingCategory, { ok: false });
    assert.deepEqual(missingCredit, { ok: false });
  });

  it('names the period and office from the submitted parameters', () => {
    assert.equal(
      financialStatementPeriodLabel(periodParameters, {
        endDate: '2026-03-31',
        startDate: '2026-03-01'
      }),
      '1 Mar 2026 – 31 Mar 2026'
    );
    assert.equal(
      financialStatementPeriodLabel(
        [periodParameters[0]],
        { endDate: '2026-03-31' }
      ),
      'As of 31 Mar 2026'
    );
    assert.equal(
      financialStatementOfficeLabel(
        periodParameters,
        { officeId: '1' },
        { officeId: 'Head Office' }
      ),
      'Head Office'
    );
    assert.equal(
      financialStatementOfficeLabel(periodParameters, { officeId: '-1' }, { officeId: 'All' }),
      undefined
    );

    const built = buildFinancialStatement({
      slug: 'income-statement',
      parameters: periodParameters,
      values: { startDate: '2026-03-01', endDate: '2026-03-31', officeId: '1' },
      displayValues: { officeId: 'Head Office' },
      result: reportResult(
        [
          ['Type', 'string'],
          ['Name', 'string'],
          ['Amount', 'decimal']
        ],
        [['Income', 'Fees', '1.00']]
      )
    });
    assert.equal(built.ok, true);
    if (!built.ok) {
      return;
    }
    assert.equal(built.statement.periodLabel, '1 Mar 2026 – 31 Mar 2026');
    assert.equal(built.statement.officeLabel, 'Head Office');
  });
});

describe('financialStatementToCsv', () => {
  it('exports formatted lines with a byte-order mark and formula guard', () => {
    const built = buildFinancialStatement({
      slug: 'balance-sheet',
      result: reportResult(
        [
          ['Type', 'string'],
          ['GL Code', 'string'],
          ['Account name', 'string'],
          ['Balance', 'decimal']
        ],
        [
          ['Asset', '', '=Cash', '10.00'],
          ['Equity', '3000', 'Capital', '-2.50']
        ]
      )
    });
    assert.equal(built.ok, true);
    if (!built.ok) {
      return;
    }

    const csv = financialStatementToCsv(built.statement);
    assert.equal(csv.startsWith('\uFEFFSection,Account,Amount'), true);
    assert.match(csv, /Assets,'=Cash,10\.00/);
    assert.match(csv, /Equity,3000 — Capital,'-2\.50/);
    assert.equal(
      financialStatementFileName('trial-balance', 'pdf', new Date(2026, 9, 2)),
      'trial-balance-2026-10-02.pdf'
    );
  });
});
