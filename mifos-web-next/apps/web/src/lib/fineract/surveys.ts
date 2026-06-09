import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyListItem } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const SURVEYS_PATH = '/surveys';

function normalizeSurveyListItem(raw: unknown): FineractSurveyListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const key = typeof row.key === 'string' ? row.key : '';
  const name = typeof row.name === 'string' ? row.name : '';
  const countryCode = typeof row.countryCode === 'string' ? row.countryCode : '';
  const validFrom = typeof row.validFrom === 'string' ? row.validFrom : '';
  const validTo = typeof row.validTo === 'string' ? row.validTo : '';
  if (!Number.isFinite(id) || !key || !name) {
    return null;
  }
  return {
    id,
    key,
    name,
    description: typeof row.description === 'string' ? row.description : undefined,
    countryCode,
    validFrom,
    validTo
  };
}

export async function listSurveys(): Promise<FineractSurveyListItem[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<unknown[]>(SURVEYS_PATH);
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => normalizeSurveyListItem(row))
    .filter((row): row is FineractSurveyListItem => row !== null);
}
