import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  StandingInstructionRunHistoryPage,
  StandingInstructionTemplate
} from '@mifos/api-client';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeStandingInstructionTemplate } from '@/lib/fineract/normalize-standing-instruction-template';

export const STANDING_INSTRUCTION_HISTORY_PATH = '/organization/standing-instructions-history';

export type StandingInstructionRunHistoryQuery = {
  clientName?: string;
  clientId?: string | number;
  transferType?: string | number;
  fromAccountType?: string | number;
  fromAccountId?: string | number;
  fromDate?: string;
  toDate?: string;
  locale?: string;
  dateFormat?: string;
};

function toSearchParams(
  entries: Record<string, string | number | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    out[key] = String(value);
  }
  return out;
}

export async function getOrganizationStandingInstructionTemplate(): Promise<StandingInstructionTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<StandingInstructionTemplate>('/standinginstructions/template');
  return normalizeStandingInstructionTemplate(raw);
}

export async function searchStandingInstructionRunHistory(
  query: StandingInstructionRunHistoryQuery
): Promise<StandingInstructionRunHistoryPage> {
  const fineract = await createFineractClient();
  return fineract.get<StandingInstructionRunHistoryPage>('/standinginstructionrunhistory', {
    locale: query.locale ?? FINERACT_LOCALE,
    dateFormat: query.dateFormat ?? FINERACT_DATE_FORMAT,
    ...toSearchParams({
      clientName: query.clientName,
      clientId: query.clientId,
      transferType: query.transferType,
      fromAccountType: query.fromAccountType,
      fromAccountId: query.fromAccountId,
      fromDate: normalizeFineractDateField(query.fromDate),
      toDate: normalizeFineractDateField(query.toDate)
    })
  });
}
