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
import type { SavingsStatementDocumentData } from '@/components/clients/savings/statement/savings-statement-view-model';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderBottomStyle: 'solid',
    paddingBottom: 20
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  statementTitle: {
    fontSize: 18,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 16
  },
  metaColumn: {
    flexDirection: 'column'
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2
  },
  metaValue: {
    fontSize: 12,
    color: '#0F172A'
  },
  summarySection: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 4,
    marginBottom: 24
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  amountCredit: { color: '#16A34A' },
  amountDebit: { color: '#DC2626' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid'
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderBottomStyle: 'solid',
    alignItems: 'center'
  },
  tableCell: {
    fontSize: 10,
    color: '#334155'
  },
  colDate: { width: '15%' },
  colDesc: { width: '40%' },
  colRef: { width: '15%' },
  colAmount: { width: '15%', textAlign: 'right' },
  colBalance: { width: '15%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 10
  }
});

export function SavingsStatementDocument({ data }: { data: SavingsStatementDocumentData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.orgName}>{data.orgName?.trim() || 'Mifos'}</Text>
            <Text style={styles.statementTitle}>Statement of Account</Text>
          </View>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Account holder</Text>
            <Text style={styles.metaValue}>{data.clientName}</Text>
            <Text style={{ ...styles.metaLabel, marginTop: 10 }}>Account number</Text>
            <Text style={styles.metaValue}>{data.accountNo}</Text>
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Statement period</Text>
            <Text style={styles.metaValue}>
              {data.periodFromLabel} – {data.periodToLabel}
            </Text>
            <Text style={{ ...styles.metaLabel, marginTop: 10 }}>Currency</Text>
            <Text style={styles.metaValue}>{data.currencyCode}</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Opening balance</Text>
            <Text style={styles.summaryValue}>{data.openingBalanceLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total deposits</Text>
            <Text style={[styles.summaryValue, styles.amountCredit]}>{data.totalDepositsLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total withdrawals</Text>
            <Text style={[styles.summaryValue, styles.amountDebit]}>
              {data.totalWithdrawalsLabel}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Closing balance</Text>
            <Text style={styles.summaryValue}>{data.closingBalanceLabel}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.colRef]}>Reference</Text>
          <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          <Text style={[styles.tableHeaderCell, styles.colBalance]}>Balance</Text>
        </View>

        {data.rows.map((row) => (
          <View key={row.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDate]}>{row.dateLabel}</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>{row.description}</Text>
            <Text style={[styles.tableCell, styles.colRef]}>{row.id}</Text>
            <Text
              style={[
                styles.tableCell,
                styles.colAmount,
                ...(row.tone === 'credit' ? [styles.amountCredit] : []),
                ...(row.tone === 'debit' ? [styles.amountDebit] : [])
              ]}
            >
              {row.amountLabel}
            </Text>
            <Text style={[styles.tableCell, styles.colBalance]}>{row.balanceLabel}</Text>
          </View>
        ))}

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
