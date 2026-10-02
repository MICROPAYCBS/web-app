'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type {
  FinancialStatement,
  FinancialStatementLine
} from '@/lib/fineract/financial-statement';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    paddingBottom: 56,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#0F172A'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderBottomStyle: 'solid',
    paddingBottom: 12,
    marginBottom: 16
  },
  brand: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold'
  },
  title: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  metaLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  metaValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderBottomStyle: 'solid'
  },
  sectionRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderBottomStyle: 'solid'
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid'
  },
  th: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569'
  },
  cell: {
    fontSize: 9,
    color: '#334155'
  },
  strong: {
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A'
  },
  colAccount: { width: '70%' },
  colAccountWide: { width: '50%' },
  colAmount: { width: '30%', textAlign: 'right' },
  colSide: { width: '25%', textAlign: 'right' },
  indent: { paddingLeft: 12 },
  note: {
    marginTop: 12,
    fontSize: 9,
    color: '#475569'
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 8
  }
});

function rowStyle(kind: FinancialStatementLine['kind']) {
  if (kind === 'section') {
    return styles.sectionRow;
  }
  if (kind === 'total' || kind === 'surplus') {
    return styles.totalRow;
  }
  return styles.tableRow;
}

export function FinancialStatementDocument({ statement }: { statement: FinancialStatement }) {
  const debitCredit = statement.layout === 'debit-credit';
  const accountColumn = debitCredit ? styles.colAccountWide : styles.colAccount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{statement.organisationName}</Text>
          <Text style={styles.title}>{statement.title}</Text>
        </View>

        {statement.periodLabel || statement.officeLabel ? (
          <View style={styles.meta}>
            {statement.periodLabel ? (
              <View>
                <Text style={styles.metaLabel}>Period</Text>
                <Text style={styles.metaValue}>{statement.periodLabel}</Text>
              </View>
            ) : null}
            {statement.officeLabel ? (
              <View>
                <Text style={styles.metaLabel}>Branch</Text>
                <Text style={styles.metaValue}>{statement.officeLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.tableHeader} fixed>
          <Text style={[styles.th, accountColumn]}>Account</Text>
          {debitCredit ? (
            <>
              <Text style={[styles.th, styles.colSide]}>Debit</Text>
              <Text style={[styles.th, styles.colSide]}>Credit</Text>
            </>
          ) : (
            <Text style={[styles.th, styles.colAmount]}>Amount</Text>
          )}
        </View>

        {statement.lines.map((line) => {
          const emphasized = line.kind !== 'line';
          const textStyle = emphasized ? [styles.cell, styles.strong] : [styles.cell];
          return (
            <View key={line.id} style={rowStyle(line.kind)} wrap={false}>
              <Text style={[...textStyle, accountColumn, ...(line.kind === 'line' ? [styles.indent] : [])]}>
                {line.label}
              </Text>
              {debitCredit ? (
                <>
                  <Text style={[...textStyle, styles.colSide]}>{line.debitLabel ?? ''}</Text>
                  <Text style={[...textStyle, styles.colSide]}>{line.creditLabel ?? ''}</Text>
                </>
              ) : (
                <Text style={[...textStyle, styles.colAmount]}>{line.amountLabel ?? ''}</Text>
              )}
            </View>
          );
        })}

        {statement.imbalanceNote ? <Text style={styles.note}>{statement.imbalanceNote}</Text> : null}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages} | Generated on ${format(new Date(), 'PPpp')}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
