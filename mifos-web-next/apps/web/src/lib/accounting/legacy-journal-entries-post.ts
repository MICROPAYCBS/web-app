/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CreateJournalEntryFormInput,
  LegacyJournalEntryPostGroupInput,
  PostLegacyJournalEntriesFormInput
} from '@mifos/validation';
import type {
  LegacyImportAnalysis,
  LegacyJournalEntryGroup
} from '@/lib/accounting/legacy-journal-entries-import';
import { isoDateToFineract } from '@/lib/fineract/date-input';

function uniqueDepartmentId(
  lines: Array<{ departmentId?: number }>
): number | undefined {
  const ids = new Set(
    lines
      .map((line) => line.departmentId)
      .filter((id): id is number => id != null && Number.isFinite(id))
  );
  if (ids.size !== 1) {
    return undefined;
  }
  return [...ids][0];
}

function joinLegacyComments(lines: LegacyJournalEntryGroup['lines']): string | undefined {
  const comments = [
    ...new Set(
      lines
        .map((line) => line.comment?.trim())
        .filter((comment): comment is string => Boolean(comment))
    )
  ];
  if (comments.length === 0) {
    return undefined;
  }
  return comments.join('; ');
}

export function legacyJournalEntryGroupToPostGroup(
  group: LegacyJournalEntryGroup
): LegacyJournalEntryPostGroupInput {
  const officeId = group.lines[0]?.officeId;
  if (officeId == null) {
    throw new Error('Legacy journal entry group has no office.');
  }

  return {
    groupKey: group.key,
    effectiveDate: group.effectiveDate,
    reference: group.reference,
    officeId,
    comments: joinLegacyComments(group.lines),
    lines: group.lines.map((line) => ({
      side: line.side,
      amount: line.amount,
      glAccountId: line.glAccountId,
      ...(line.departmentId != null ? { departmentId: line.departmentId } : {})
    }))
  };
}

export function buildPostLegacyJournalEntriesInput(
  analysis: LegacyImportAnalysis,
  currencyCode: string
): PostLegacyJournalEntriesFormInput {
  if (!analysis.canPost) {
    throw new Error('Legacy import analysis is not ready to post.');
  }
  return {
    currencyCode,
    groups: analysis.groups.map(legacyJournalEntryGroupToPostGroup)
  };
}

export function legacyPostGroupToCreateJournalEntryForm(
  group: LegacyJournalEntryPostGroupInput,
  currencyCode: string
): CreateJournalEntryFormInput {
  const debits = group.lines
    .filter((line) => line.side === 'DR')
    .map((line) => ({
      glAccountId: line.glAccountId,
      amount: line.amount,
      ...(line.departmentId != null ? { departmentId: line.departmentId } : {})
    }));
  const credits = group.lines
    .filter((line) => line.side === 'CR')
    .map((line) => ({
      glAccountId: line.glAccountId,
      amount: line.amount,
      ...(line.departmentId != null ? { departmentId: line.departmentId } : {})
    }));

  const debitDepartmentId = uniqueDepartmentId(debits);
  const creditDepartmentId = uniqueDepartmentId(credits);

  return {
    debitOfficeId: group.officeId,
    creditOfficeId: group.officeId,
    ...(debitDepartmentId != null ? { debitDepartmentId } : {}),
    ...(creditDepartmentId != null ? { creditDepartmentId } : {}),
    currencyCode,
    transactionDate: isoDateToFineract(group.effectiveDate),
    debits,
    credits,
    referenceNumber: group.reference.trim() || undefined,
    comments: group.comments?.trim() || ''
  };
}
