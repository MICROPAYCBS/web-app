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
import type { SavingsReceiptData } from '@/components/clients/savings/receipt/savings-receipt-view-model';
import { DEFAULT_REPORT_ORG_NAME } from '@/lib/fineract/report-branding';

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
    alignItems: 'center',
    marginBottom: 10
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  title: {
    fontSize: 18,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  section: {
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderBottomStyle: 'solid'
  },
  label: {
    fontSize: 10,
    color: '#64748B'
  },
  value: {
    fontSize: 10,
    color: '#0F172A',
    fontWeight: 'bold',
    maxWidth: '60%',
    textAlign: 'right'
  },
  amountSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    alignItems: 'center'
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 5
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A'
  },
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

function ReceiptRow({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) {
    return null;
  }
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function SavingsReceiptDocument({ receipt }: { receipt: SavingsReceiptData }) {
  const generatedAt = format(new Date(), 'PPpp');

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.orgName}>{receipt.orgName?.trim() || DEFAULT_REPORT_ORG_NAME}</Text>
            <Text style={styles.title}>Transaction Receipt</Text>
          </View>
        </View>

        <View style={styles.section}>
          <ReceiptRow label="Account holder" value={receipt.clientName} />
          <ReceiptRow label="Account number" value={receipt.accountNo} />
          <ReceiptRow label="Transaction ID" value={String(receipt.transactionId)} />
          <ReceiptRow label="Date" value={receipt.transactionDateLabel} />
          <ReceiptRow label="Transaction type" value={receipt.transactionTypeLabel} />
          <ReceiptRow label="Payment type" value={receipt.paymentType} />
          <ReceiptRow label="Payment account no." value={receipt.accountNumber} />
          <ReceiptRow label="Routing / sort code" value={receipt.routingCode} />
          <ReceiptRow label="Check number" value={receipt.checkNumber} />
          <ReceiptRow label="Receipt number" value={receipt.receiptNumber} />
          <ReceiptRow label="Bank reference" value={receipt.bankNumber} />
          <ReceiptRow label="Note" value={receipt.note} />
          <ReceiptRow label="Running balance" value={receipt.runningBalanceLabel} />
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total amount</Text>
          <Text style={styles.amountValue}>{receipt.transactionAmountLabel}</Text>
        </View>

        <Text style={styles.footer} fixed>
          Generated on {generatedAt}
        </Text>
      </Page>
    </Document>
  );
}
