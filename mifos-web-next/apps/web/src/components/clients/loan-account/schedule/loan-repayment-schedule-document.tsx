'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanRepaymentScheduleDocumentData } from '@/components/clients/loan-account/schedule/loan-repayment-schedule-view-model';
import { resolveLoanScheduleOrgName } from '@/components/clients/loan-account/schedule/loan-repayment-schedule-view-model';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#0F172A'
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid',
    paddingBottom: 14
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  orgName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  docTitle: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'right'
  },
  generatedOn: {
    marginTop: 8,
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'right'
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16
  },
  metaColumn: {
    flex: 1
  },
  metaLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  metaValue: {
    fontSize: 10,
    color: '#0F172A',
    marginBottom: 8
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    gap: 8
  },
  summaryItem: {
    width: '23%'
  },
  summaryLabel: {
    fontSize: 7,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    borderBottomStyle: 'solid'
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderBottomStyle: 'solid',
    alignItems: 'center'
  },
  tableRowMuted: {
    backgroundColor: '#F8FAFC'
  },
  tableCell: {
    fontSize: 8,
    color: '#334155'
  },
  tableCellRight: {
    fontSize: 8,
    color: '#334155',
    textAlign: 'right'
  },
  colPeriod: { width: '6%' },
  colDate: { width: '14%' },
  colDays: { width: '6%' },
  colMoney: { width: '11%' },
  colBalance: { width: '12%' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 8
  }
});

function HeaderCell({ width, label, align = 'left' }: { width: string; label: string; align?: 'left' | 'right' }) {
  return (
    <Text style={[styles.tableHeaderCell, { width }, align === 'right' ? { textAlign: 'right' } : {}]}>
      {label}
    </Text>
  );
}

function RowCell({
  width,
  value,
  align = 'left',
  bold = false
}: {
  width: string;
  value: string;
  align?: 'left' | 'right';
  bold?: boolean;
}) {
  return (
    <Text
      style={[
        align === 'right' ? styles.tableCellRight : styles.tableCell,
        { width },
        bold ? { fontWeight: 'bold' } : {}
      ]}
    >
      {value}
    </Text>
  );
}

export function LoanRepaymentScheduleDocument({ data }: { data: LoanRepaymentScheduleDocumentData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.orgName}>{resolveLoanScheduleOrgName(data.orgName)}</Text>
            <View>
              <Text style={styles.docTitle}>Loan repayment schedule</Text>
              <Text style={styles.generatedOn}>Generated {data.generatedOnLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Customer</Text>
            <Text style={styles.metaValue}>{data.clientName}</Text>
            <Text style={styles.metaLabel}>Loan account</Text>
            <Text style={styles.metaValue}>{data.accountNo}</Text>
            <Text style={styles.metaLabel}>Product</Text>
            <Text style={styles.metaValue}>{data.productName}</Text>
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{data.loanStatus}</Text>
            <Text style={styles.metaLabel}>Currency</Text>
            <Text style={styles.metaValue}>{data.currencyCode}</Text>
            {data.officeName ? (
              <>
                <Text style={styles.metaLabel}>Branch</Text>
                <Text style={styles.metaValue}>{data.officeName}</Text>
              </>
            ) : null}
            {data.loanOfficerName ? (
              <>
                <Text style={styles.metaLabel}>Loan officer</Text>
                <Text style={styles.metaValue}>{data.loanOfficerName}</Text>
              </>
            ) : null}
          </View>
          <View style={styles.metaColumn}>
            <Text style={styles.metaLabel}>First repayment</Text>
            <Text style={styles.metaValue}>{data.firstRepaymentLabel}</Text>
            <Text style={styles.metaLabel}>Last repayment</Text>
            <Text style={styles.metaValue}>{data.lastRepaymentLabel}</Text>
            <Text style={styles.metaLabel}>Installments</Text>
            <Text style={styles.metaValue}>{data.installmentCountLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Principal disbursed</Text>
            <Text style={styles.summaryValue}>{data.principalDisbursedLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expected principal</Text>
            <Text style={styles.summaryValue}>{data.principalExpectedLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total interest</Text>
            <Text style={styles.summaryValue}>{data.totalInterestLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total fees</Text>
            <Text style={styles.summaryValue}>{data.totalFeesLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total repayment</Text>
            <Text style={styles.summaryValue}>{data.totalRepaymentLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Loan term</Text>
            <Text style={styles.summaryValue}>{data.loanTermLabel}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Average installment</Text>
            <Text style={styles.summaryValue}>{data.averageInstallmentLabel}</Text>
          </View>
        </View>

        <View>
          <View style={styles.tableHeader}>
            <HeaderCell width="6%" label="#" />
            <HeaderCell width="14%" label="Due date" />
            <HeaderCell width="6%" label="Days" />
            <HeaderCell width="11%" label="Principal" align="right" />
            <HeaderCell width="11%" label="Interest" align="right" />
            <HeaderCell width="11%" label="Fees" align="right" />
            <HeaderCell width="11%" label="Installment" align="right" />
            <HeaderCell width="12%" label="Balance" align="right" />
            <HeaderCell width="18%" label="Note" />
          </View>
          {data.rows.map((row) => (
            <View
              key={row.key}
              style={[styles.tableRow, row.note === 'Disbursement' ? styles.tableRowMuted : {}]}
            >
              <RowCell width="6%" value={row.period} />
              <RowCell width="14%" value={row.dueDate} />
              <RowCell width="6%" value={row.daysInPeriod} />
              <RowCell width="11%" value={row.principalDue} align="right" />
              <RowCell width="11%" value={row.interestDue} align="right" />
              <RowCell width="11%" value={row.feesDue} align="right" />
              <RowCell width="11%" value={row.installment} align="right" bold />
              <RowCell width="12%" value={row.balance} align="right" />
              <RowCell width="18%" value={row.note ?? ''} />
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          {resolveLoanScheduleOrgName(data.orgName)} · Loan {data.accountNo} · {data.currencyCode}
        </Text>
      </Page>
    </Document>
  );
}
