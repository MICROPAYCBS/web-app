import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateStandingInstructionResponse,
  StandingInstructionTemplate,
  StandingInstructionsPage, FineractCommandProcessingResult } from '@mifos/api-client';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import {
  formatFineractDateWithContext,
  parseFineractDateWithContext,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeStandingInstructionTemplate } from '@/lib/fineract/normalize-standing-instruction-template';

export type StandingInstructionListQuery = {
  clientId: string | number;
  clientName?: string;
  fromAccountType: string;
  fromAccountId?: string | number;
  fromTransferType?: string | number;
  limit?: number;
  offset?: number;
};

export type StandingInstructionTemplateQuery = {
  fromClientId: string | number;
  fromOfficeId: string | number;
  fromAccountType: string;
  /** Partial form values forwarded to refresh dependent dropdowns. */
  cascade?: Record<string, string | number | undefined>;
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

export async function listStandingInstructions(
  query: StandingInstructionListQuery
): Promise<StandingInstructionsPage> {
  const fineract = await createFineractClient();
  return fineract.get<StandingInstructionsPage>('/standinginstructions', {
    clientId: String(query.clientId),
    clientName: query.clientName ?? '',
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT,
    limit: String(query.limit ?? 100),
    offset: String(query.offset ?? 0),
    fromAccountType: query.fromAccountType,
    ...toSearchParams({
      fromAccountId: query.fromAccountId,
      fromTransferType: query.fromTransferType
    })
  });
}

export async function getStandingInstructionTemplate(
  query: StandingInstructionTemplateQuery
): Promise<StandingInstructionTemplate> {
  const fromOfficeId = Number(query.fromOfficeId);
  if (!Number.isFinite(fromOfficeId) || fromOfficeId <= 0) {
    throw new Error('A valid client office is required to load standing instruction options.');
  }

  const fineract = await createFineractClient();
  const raw = await fineract.get<StandingInstructionTemplate>('/standinginstructions/template', {
    fromClientId: String(query.fromClientId),
    fromOfficeId: String(fromOfficeId),
    fromAccountType: query.fromAccountType,
    ...toSearchParams(query.cascade ?? {})
  });
  return normalizeStandingInstructionTemplate(raw, {
    fromClientId: query.fromClientId
  });
}

export type CreateStandingInstructionBody = Record<string, unknown>;

export async function createStandingInstruction(
  body: CreateStandingInstructionBody
): Promise<CreateStandingInstructionResponse> {
  const fineract = await createFineractClient();
  return fineract.post<CreateStandingInstructionResponse>('/standinginstructions', body);
}

export async function deleteStandingInstruction(id: string | number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>('/standinginstructions/' + id, { command: 'delete' });
}

const MONTH_DAY_FORMAT = 'dd MMMM';

/** Build Fineract POST body from validated form input. */
export function buildCreateStandingInstructionBody(
  input: {
    name: string;
    transferType: number;
    priority: number;
    status: number;
    fromAccountType: number;
    fromAccountId: number;
    toOfficeId: number;
    toClientId: number;
    toAccountType: number;
    toAccountId: number;
    instructionType: number;
    amount?: number;
    validFrom: string;
    validTill: string;
    recurrenceType: number;
    recurrenceInterval?: number;
    recurrenceFrequency?: number;
    recurrenceOnMonthDay?: string;
  },
  context: {
    fromClientId: string | number;
    fromOfficeId: string | number;
    dateFormat?: string;
    locale?: string;
  }
): CreateStandingInstructionBody {
  const dateCtx = resolveFineractDateContext({
    dateFormat: context.dateFormat,
    locale: context.locale
  });

  const body: CreateStandingInstructionBody = {
    name: input.name,
    transferType: input.transferType,
    priority: input.priority,
    status: input.status,
    fromAccountType: input.fromAccountType,
    fromAccountId: input.fromAccountId,
    toOfficeId: input.toOfficeId,
    toClientId: input.toClientId,
    toAccountType: input.toAccountType,
    toAccountId: input.toAccountId,
    instructionType: input.instructionType,
    validFrom: input.validFrom,
    validTill: input.validTill,
    recurrenceType: input.recurrenceType,
    fromClientId: context.fromClientId,
    fromOfficeId: context.fromOfficeId,
    dateFormat: dateCtx.dateFormat,
    locale: dateCtx.locale,
    monthDayFormat: MONTH_DAY_FORMAT
  };

  if (input.amount !== undefined) {
    body.amount = input.amount;
  }
  if (input.recurrenceInterval !== undefined) {
    body.recurrenceInterval = input.recurrenceInterval;
  }
  if (input.recurrenceFrequency !== undefined) {
    body.recurrenceFrequency = input.recurrenceFrequency;
  }
  if (input.recurrenceOnMonthDay?.trim()) {
    const parsed = parseFineractDateWithContext(input.recurrenceOnMonthDay, dateCtx);
    if (parsed) {
      body.recurrenceOnMonthDay = formatFineractDateWithContext(parsed, {
        ...dateCtx,
        dateFormat: MONTH_DAY_FORMAT
      });
    }
  }

  return body;
}
