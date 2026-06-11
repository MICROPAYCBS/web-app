import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountingRuleDetail,
  FineractAccountingRuleFormTemplate,
  FineractAccountingRuleGlAccountRef,
  FineractAccountingRuleListItem,
  FineractAccountingRuleMutationResponse,
  FineractAccountingRuleTagRef,
  FineractAccountingRuleTemplateOption,
  FineractOfficeOption
} from '@mifos/api-client';
import { buildUpsertAccountingRulePayload, type UpsertAccountingRuleFormInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const ACCOUNTING_RULES_PATH = '/accountingrules';

function normalizeGlAccountRef(raw: unknown): FineractAccountingRuleGlAccountRef | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const glCode = typeof row.glCode === 'string' ? row.glCode : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return { id, name, glCode };
}

function normalizeTagRef(raw: unknown): FineractAccountingRuleTagRef | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const tagRaw = row.tag;
  if (!tagRaw || typeof tagRaw !== 'object') {
    return null;
  }
  const tag = tagRaw as Record<string, unknown>;
  const id = Number(tag.id);
  const name = typeof tag.name === 'string' ? tag.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return { tag: { id, name } };
}

function normalizeTemplateOption(raw: unknown): FineractAccountingRuleTemplateOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    name,
    glCode: typeof row.glCode === 'string' ? row.glCode : undefined
  };
}

function normalizeOfficeOption(raw: unknown): FineractOfficeOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : undefined;
  const nameDecorated = typeof row.nameDecorated === 'string' ? row.nameDecorated : undefined;
  if (!Number.isFinite(id) || (!name && !nameDecorated)) {
    return null;
  }
  return { id, name: name ?? nameDecorated ?? String(id), nameDecorated };
}

function normalizeAccountingRuleListItem(raw: unknown): FineractAccountingRuleListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const officeName = typeof row.officeName === 'string' ? row.officeName : '';
  if (!Number.isFinite(id) || !name || !officeName) {
    return null;
  }

  const debitTags = Array.isArray(row.debitTags)
    ? row.debitTags
        .map((item) => normalizeTagRef(item))
        .filter((item): item is FineractAccountingRuleTagRef => item !== null)
    : undefined;
  const creditTags = Array.isArray(row.creditTags)
    ? row.creditTags
        .map((item) => normalizeTagRef(item))
        .filter((item): item is FineractAccountingRuleTagRef => item !== null)
    : undefined;
  const debitAccounts = Array.isArray(row.debitAccounts)
    ? row.debitAccounts
        .map((item) => normalizeGlAccountRef(item))
        .filter((item): item is FineractAccountingRuleGlAccountRef => item !== null)
    : undefined;
  const creditAccounts = Array.isArray(row.creditAccounts)
    ? row.creditAccounts
        .map((item) => normalizeGlAccountRef(item))
        .filter((item): item is FineractAccountingRuleGlAccountRef => item !== null)
    : undefined;

  return {
    id,
    name,
    officeName,
    officeId: Number.isFinite(Number(row.officeId)) ? Number(row.officeId) : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    allowMultipleDebitEntries: row.allowMultipleDebitEntries === true,
    allowMultipleCreditEntries: row.allowMultipleCreditEntries === true,
    debitTags,
    creditTags,
    debitAccounts,
    creditAccounts
  };
}

export async function listAccountingRules(): Promise<FineractAccountingRuleListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(ACCOUNTING_RULES_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeAccountingRuleListItem(item))
    .filter((item): item is FineractAccountingRuleListItem => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listAccountingRulesForFrequentPostings(): Promise<
  FineractAccountingRuleListItem[]
> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(ACCOUNTING_RULES_PATH, { associations: 'all' });
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeAccountingRuleListItem(item))
    .filter((item): item is FineractAccountingRuleListItem => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getAccountingRule(accountingRuleId: number): Promise<FineractAccountingRuleDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${ACCOUNTING_RULES_PATH}/${accountingRuleId}`);
  const rule = normalizeAccountingRuleListItem(raw);
  if (!rule) {
    return null;
  }
  const officeId = Number((raw as Record<string, unknown>).officeId);
  if (!Number.isFinite(officeId)) {
    return null;
  }
  return { ...rule, officeId };
}

export async function getAccountingRuleFormTemplate(): Promise<FineractAccountingRuleFormTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${ACCOUNTING_RULES_PATH}/template`);
  if (!raw || typeof raw !== 'object') {
    return {
      allowedOffices: [],
      allowedAccounts: [],
      allowedDebitTagOptions: [],
      allowedCreditTagOptions: []
    };
  }
  const row = raw as Record<string, unknown>;
  return {
    allowedOffices: Array.isArray(row.allowedOffices)
      ? row.allowedOffices
          .map((item) => normalizeOfficeOption(item))
          .filter((item): item is FineractOfficeOption => item !== null)
      : [],
    allowedAccounts: Array.isArray(row.allowedAccounts)
      ? row.allowedAccounts
          .map((item) => normalizeTemplateOption(item))
          .filter((item): item is FineractAccountingRuleTemplateOption => item !== null)
      : [],
    allowedDebitTagOptions: Array.isArray(row.allowedDebitTagOptions)
      ? row.allowedDebitTagOptions
          .map((item) => normalizeTemplateOption(item))
          .filter((item): item is FineractAccountingRuleTemplateOption => item !== null)
      : [],
    allowedCreditTagOptions: Array.isArray(row.allowedCreditTagOptions)
      ? row.allowedCreditTagOptions
          .map((item) => normalizeTemplateOption(item))
          .filter((item): item is FineractAccountingRuleTemplateOption => item !== null)
      : []
  };
}

export async function createAccountingRule(
  input: UpsertAccountingRuleFormInput
): Promise<FineractAccountingRuleMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<FineractAccountingRuleMutationResponse>(
    ACCOUNTING_RULES_PATH,
    buildUpsertAccountingRulePayload(input)
  );
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateAccountingRule(
  accountingRuleId: number,
  input: UpsertAccountingRuleFormInput
): Promise<FineractAccountingRuleMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<FineractAccountingRuleMutationResponse>(
    `${ACCOUNTING_RULES_PATH}/${accountingRuleId}`,
    buildUpsertAccountingRulePayload(input)
  );
  return { resourceId: Number(raw?.resourceId ?? accountingRuleId) };
}

export async function deleteAccountingRule(accountingRuleId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${ACCOUNTING_RULES_PATH}/${accountingRuleId}`);
}
