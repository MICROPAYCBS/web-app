/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientNote, FineractCommandProcessingResult } from '@mifos/api-client';
import type { ClientNoteInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

export async function getLoanNotes(accountId: string | number): Promise<FineractClientNote[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractClientNote[]>(`/loans/${accountId}/notes`);
  return Array.isArray(data) ? data : [];
}

export async function createLoanNote(
  accountId: string | number,
  input: ClientNoteInput
): Promise<{ resourceId: number }> {
  const fineract = await createFineractClient();
  return fineract.post<{ resourceId: number }>(`/loans/${accountId}/notes`, input);
}

export async function updateLoanNote(
  accountId: string | number,
  noteId: number,
  input: ClientNoteInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/loans/${accountId}/notes/${noteId}`,
    input
  );
}

export async function deleteLoanNote(
  accountId: string | number,
  noteId: number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(
    `/loans/${accountId}/notes/${noteId}`
  );
}
