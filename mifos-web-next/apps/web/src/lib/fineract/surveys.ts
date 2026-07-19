import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyDetail,
  FineractSurveyListItem,
  FineractSurveyMutationResponse,
  FineractSurveyQuestionData,
  FineractSurveyResponseData, FineractCommandProcessingResult } from '@mifos/api-client';
import { buildSurveyApiPayload, type UpsertSurveyFormInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const SURVEYS_PATH = '/surveys';

function normalizeSurveyResponseData(raw: unknown): FineractSurveyResponseData | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const text = typeof row.text === 'string' ? row.text : '';
  const value = Number(row.value);
  const sequenceNo = Number(row.sequenceNo);
  if (!text || !Number.isFinite(value) || !Number.isFinite(sequenceNo)) {
    return null;
  }
  return {
    id: Number.isFinite(Number(row.id)) ? Number(row.id) : undefined,
    text,
    value,
    sequenceNo
  };
}

function normalizeSurveyQuestionData(raw: unknown): FineractSurveyQuestionData | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const key = typeof row.key === 'string' ? row.key : '';
  const text = typeof row.text === 'string' ? row.text : '';
  const sequenceNo = Number(row.sequenceNo);
  if (!key || !text || !Number.isFinite(sequenceNo)) {
    return null;
  }
  const responseDatas = Array.isArray(row.responseDatas)
    ? row.responseDatas
        .map((item) => normalizeSurveyResponseData(item))
        .filter((item): item is FineractSurveyResponseData => item !== null)
        .sort((left, right) => left.sequenceNo - right.sequenceNo)
    : [];
  return {
    id: Number.isFinite(Number(row.id)) ? Number(row.id) : undefined,
    key,
    text,
    sequenceNo,
    description: typeof row.description === 'string' ? row.description : undefined,
    responseDatas
  };
}

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

function normalizeSurveyDetail(raw: unknown): FineractSurveyDetail | null {
  const summary = normalizeSurveyListItem(raw);
  if (!summary || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const questionDatas = Array.isArray(row.questionDatas)
    ? row.questionDatas
        .map((item) => normalizeSurveyQuestionData(item))
        .filter((item): item is FineractSurveyQuestionData => item !== null)
        .sort((left, right) => left.sequenceNo - right.sequenceNo)
    : [];
  return {
    ...summary,
    questionDatas
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

export async function getSurvey(surveyId: number): Promise<FineractSurveyDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${SURVEYS_PATH}/${surveyId}?template=true`);
  return normalizeSurveyDetail(raw);
}

export async function createSurvey(
  input: UpsertSurveyFormInput
): Promise<FineractSurveyMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractSurveyMutationResponse>(SURVEYS_PATH, buildSurveyApiPayload(input));
}

export async function updateSurvey(
  surveyId: number,
  input: UpsertSurveyFormInput
): Promise<FineractSurveyMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractSurveyMutationResponse>(
    `${SURVEYS_PATH}/${surveyId}`,
    buildSurveyApiPayload(input)
  );
}

export async function activateSurvey(surveyId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`${SURVEYS_PATH}/${surveyId}?command=activate`, null);
}

export async function deactivateSurvey(surveyId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`${SURVEYS_PATH}/${surveyId}?command=deactivate`, null);
}
