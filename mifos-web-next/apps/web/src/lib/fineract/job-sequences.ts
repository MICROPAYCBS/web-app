import 'server-only';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractJobSequence,
  FineractJobSequenceExecuteResponse,
  FineractJobSequenceRun,
  FineractJobSequenceRunStep,
  FineractJobSequenceStep,
  FineractJobSequenceWritePayload,
  JobSequenceRunStatus,
  JobSequenceStepType
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const JOB_SEQUENCES_PATH = '/jobsequences';

const RUN_STATUSES = new Set<JobSequenceRunStatus>([
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'SKIPPED'
]);

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function normalizeStepType(value: unknown): JobSequenceStepType | undefined {
  if (value === 'SCHEDULER_JOB' || value === 'OPERATION') {
    return value;
  }
  return undefined;
}

function normalizeRunStatus(value: unknown): JobSequenceRunStatus | undefined {
  if (typeof value === 'string' && RUN_STATUSES.has(value as JobSequenceRunStatus)) {
    return value as JobSequenceRunStatus;
  }
  return undefined;
}

function normalizeStep(raw: unknown): FineractJobSequenceStep | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const stepOrder = asNumber(row.stepOrder);
  const stepType = normalizeStepType(row.stepType);
  if (stepOrder == null || stepType == null) {
    return null;
  }
  return {
    id: asNumber(row.id),
    stepOrder,
    stepType,
    jobShortName: asString(row.jobShortName) ?? null,
    operationCode: asString(row.operationCode) ?? null,
    enabled: asBoolean(row.enabled, true),
    stopOnFailure: asBoolean(row.stopOnFailure, true)
  };
}

function normalizeSequence(raw: unknown): FineractJobSequence | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const name = asString(row.name);
  if (id == null || !name) {
    return null;
  }
  const steps = Array.isArray(row.steps)
    ? row.steps
        .map((item) => normalizeStep(item))
        .filter((item): item is FineractJobSequenceStep => item !== null)
        .sort((a, b) => a.stepOrder - b.stepOrder)
    : [];
  return {
    id,
    name,
    description: asString(row.description) ?? null,
    active: asBoolean(row.active, true),
    steps
  };
}

function normalizeRunStep(raw: unknown): FineractJobSequenceRunStep | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const stepOrder = asNumber(row.stepOrder);
  const stepType = normalizeStepType(row.stepType);
  const status = normalizeRunStatus(row.status);
  if (id == null || stepOrder == null || stepType == null || status == null) {
    return null;
  }
  return {
    id,
    stepOrder,
    stepType,
    operationCode: asString(row.operationCode) ?? null,
    jobShortName: asString(row.jobShortName) ?? null,
    status,
    startedAt: asString(row.startedAt) ?? null,
    finishedAt: asString(row.finishedAt) ?? null,
    schedulerJobId: asNumber(row.schedulerJobId) ?? null,
    errorMessage: asString(row.errorMessage) ?? null
  };
}

function normalizeRun(raw: unknown): FineractJobSequenceRun | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = asNumber(row.id);
  const sequenceId = asNumber(row.sequenceId);
  const sequenceName = asString(row.sequenceName) ?? '';
  const status = normalizeRunStatus(row.status);
  if (id == null || sequenceId == null || status == null) {
    return null;
  }
  const steps = Array.isArray(row.steps)
    ? row.steps
        .map((item) => normalizeRunStep(item))
        .filter((item): item is FineractJobSequenceRunStep => item !== null)
        .sort((a, b) => a.stepOrder - b.stepOrder)
    : [];
  return {
    id,
    sequenceId,
    sequenceName,
    triggeredByUserId: asNumber(row.triggeredByUserId) ?? null,
    status,
    startedAt: asString(row.startedAt) ?? null,
    finishedAt: asString(row.finishedAt) ?? null,
    errorMessage: asString(row.errorMessage) ?? null,
    steps
  };
}

export async function listJobSequences(): Promise<FineractJobSequence[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(JOB_SEQUENCES_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeSequence(item))
    .filter((item): item is FineractJobSequence => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getJobSequence(
  sequenceId: string | number
): Promise<FineractJobSequence | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${JOB_SEQUENCES_PATH}/${sequenceId}`);
  return normalizeSequence(raw);
}

export async function createJobSequence(
  payload: FineractJobSequenceWritePayload
): Promise<FineractJobSequenceExecuteResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractJobSequenceExecuteResponse>(JOB_SEQUENCES_PATH, payload);
}

export async function updateJobSequence(
  sequenceId: string | number,
  payload: FineractJobSequenceWritePayload
): Promise<FineractJobSequenceExecuteResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractJobSequenceExecuteResponse>(
    `${JOB_SEQUENCES_PATH}/${sequenceId}`,
    payload
  );
}

export async function deleteJobSequence(sequenceId: string | number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${JOB_SEQUENCES_PATH}/${sequenceId}`);
}

export async function executeJobSequence(
  sequenceId: string | number
): Promise<FineractJobSequenceExecuteResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractJobSequenceExecuteResponse>(
    `${JOB_SEQUENCES_PATH}/${sequenceId}?command=execute`,
    {}
  );
}

export async function listJobSequenceRuns(
  sequenceId: string | number
): Promise<FineractJobSequenceRun[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${JOB_SEQUENCES_PATH}/${sequenceId}/runs`);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeRun(item))
    .filter((item): item is FineractJobSequenceRun => item !== null)
    .sort((a, b) => b.id - a.id);
}

export async function getJobSequenceRun(
  sequenceId: string | number,
  runId: string | number
): Promise<FineractJobSequenceRun | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(
    `${JOB_SEQUENCES_PATH}/${sequenceId}/runs/${runId}`
  );
  return normalizeRun(raw);
}
