import 'server-only';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountDetail, FineractJournalEntryGlAccountOption } from '@mifos/api-client';
import { buildGlAccountEnquirySummaryFromReport } from '@/lib/accounting/gl-account-enquiry-summary';
import type { GlAccountEnquirySummary } from '@/lib/accounting/gl-account-enquiry-summary';
import {
  GL_ACCOUNT_ENQUIRY_REPORT_NAME,
  buildGlAccountEnquiryReportParams,
  glAccountEnquiryHasRequiredFilters,
  type GlAccountEnquiryLine,
  type GlAccountEnquiryListQuery
} from '@/lib/fineract/gl-account-enquiry-query';
import { createFineractClient } from '@/lib/fineract/create-client';
import { getGlAccount } from '@/lib/fineract/gl-accounts';
import { sanitizeReportRunRows } from '@/lib/fineract/report-run-display';
import { runReport } from '@/lib/fineract/run-reports';

function normalizeGlAccountOption(raw: unknown): FineractJournalEntryGlAccountOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const glCode = typeof row.glCode === 'string' ? row.glCode : '';
  if (!Number.isFinite(id) || !name || !glCode) {
    return null;
  }
  const typeRaw = row.type;
  const typeId =
    typeRaw && typeof typeRaw === 'object' && 'id' in (typeRaw as Record<string, unknown>)
      ? Number((typeRaw as Record<string, unknown>).id)
      : undefined;
  return {
    id,
    name,
    glCode,
    typeId: Number.isFinite(typeId) ? typeId : undefined
  };
}

function readRowNumber(row: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const direct = row[key];
    if (direct != null && Number.isFinite(Number(direct))) {
      return Number(direct);
    }
    const lower = row[key.toLowerCase()];
    if (lower != null && Number.isFinite(Number(lower))) {
      return Number(lower);
    }
  }
  return 0;
}

function readRowString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const direct = row[key];
    if (typeof direct === 'string' && direct.trim()) {
      return direct.trim();
    }
    if (Array.isArray(direct) && direct.length >= 3) {
      const [year, month, day] = direct.map(Number);
      if (year && month && day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    const lower = row[key.toLowerCase()];
    if (typeof lower === 'string' && lower.trim()) {
      return lower.trim();
    }
    if (Array.isArray(lower) && lower.length >= 3) {
      const [year, month, day] = lower.map(Number);
      if (year && month && day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return '';
}

function normalizeEnquiryLine(row: Record<string, unknown>): GlAccountEnquiryLine | null {
  const transactionId = readRowString(row, ['transaction_id', 'transactionId']);
  const entryDate = readRowString(row, ['entry_date', 'entryDate']);
  if (!transactionId && !entryDate) {
    return null;
  }
  return {
    entryDate,
    debitAmount: readRowNumber(row, ['debit_amount', 'debitAmount']),
    creditAmount: readRowNumber(row, ['credit_amount', 'creditAmount']),
    description: readRowString(row, ['description']) || undefined,
    openingBalance: readRowNumber(row, ['openingbalance', 'openingBalance']),
    source: readRowString(row, ['source']) || '—',
    transactionId: transactionId || '—',
    cumulativeSum: readRowNumber(row, ['cumulative_sum', 'cumulativeSum'])
  };
}

export async function listGlAccountEnquiryOptions(): Promise<FineractJournalEntryGlAccountOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/glaccounts', {
    usage: '1',
    disabled: 'false'
  });
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeGlAccountOption(item))
    .filter((item): item is FineractJournalEntryGlAccountOption => item !== null)
    .sort((left, right) => left.glCode.localeCompare(right.glCode));
}

export type GlAccountEnquiryResult = {
  lines: GlAccountEnquiryLine[];
  summary: GlAccountEnquirySummary | null;
  glAccount: FineractGlAccountDetail | null;
};

export async function fetchGlAccountEnquiry(
  query: GlAccountEnquiryListQuery
): Promise<GlAccountEnquiryResult> {
  if (!glAccountEnquiryHasRequiredFilters(query)) {
    return {
      lines: [],
      summary: null,
      glAccount: null
    };
  }

  const glAccountId = Number(query.glAccountId);
  const [report, glAccount] = await Promise.all([
    runReport(GL_ACCOUNT_ENQUIRY_REPORT_NAME, buildGlAccountEnquiryReportParams(query)),
    getGlAccount(glAccountId).catch(() => null)
  ]);

  const lines = sanitizeReportRunRows(report)
    .map((row) => normalizeEnquiryLine(row))
    .filter((line): line is GlAccountEnquiryLine => line !== null);

  const glAccountTypeId = glAccount?.type?.id;
  const summary =
    glAccountTypeId == null
      ? null
      : buildGlAccountEnquirySummaryFromReport({
          lines,
          glAccountTypeId
        });

  return { lines, summary, glAccount };
}
