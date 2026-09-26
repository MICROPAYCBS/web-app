import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ChargeDetail,
  ChargeListItem,
  ChargeMutationResponse,
  ChargeTemplate,
  ChargeTier,
  FineractCurrencyOption,
  FineractCommandProcessingResult
} from '@mifos/api-client';
import type { UpsertChargeInput } from '@mifos/validation';
import { FineractHttpError } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { feeOnMonthDayFromCharge } from '@/lib/fineract/charge-form-logic';
import { listOrganizationPaymentTypes } from '@/lib/fineract/payment-types';
import { buildChargePayload } from '@/lib/fineract/charge-payload';
import {
  filterCurrencyOptionsBySelected,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
import { asCurrency, asEnumOption } from '@/lib/fineract/product-normalize';

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeChargeTiers(value: unknown): ChargeTier[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const tiers: ChargeTier[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const amountRangeFrom = asNumber(row.amountRangeFrom);
    const amount = asNumber(row.amount);
    if (amountRangeFrom == null || amount == null) {
      continue;
    }
    const amountRangeTo =
      row.amountRangeTo === null || row.amountRangeTo === undefined
        ? null
        : asNumber(row.amountRangeTo);
    const id = asNumber(row.id);
    tiers.push({
      id: id != null && Number.isInteger(id) ? id : undefined,
      amountRangeFrom,
      amountRangeTo: amountRangeTo ?? null,
      amount
    });
  }
  return tiers;
}

function asCurrencyOptions(value: unknown): FineractCurrencyOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const options: FineractCurrencyOption[] = [];
  for (const item of value) {
    const currency = asCurrency(item);
    if (currency?.code) {
      options.push(currency);
    }
  }
  return options;
}

function asEnumOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => asEnumOption(item))
    .filter((item): item is NonNullable<typeof item> => item != null);
}

function asTaxGroupOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      if (!Number.isFinite(id)) {
        return null;
      }
      return {
        id,
        name: typeof row.name === 'string' ? row.name : undefined
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
}

function normalizeListItem(item: unknown): ChargeListItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const currency = asCurrency(row.currency);
  return {
    id,
    name: typeof row.name === 'string' ? row.name : undefined,
    active: typeof row.active === 'boolean' ? row.active : undefined,
    penalty: typeof row.penalty === 'boolean' ? row.penalty : undefined,
    amount: typeof row.amount === 'number' ? row.amount : undefined,
    currency,
    currencyCode:
      currency?.code ?? (typeof row.currencyCode === 'string' ? row.currencyCode : undefined),
    chargeAppliesTo: asEnumOption(row.chargeAppliesTo),
    chargeTimeType: asEnumOption(row.chargeTimeType),
    chargeCalculationType: asEnumOption(row.chargeCalculationType),
    chargePaymentMode: asEnumOption(row.chargePaymentMode)
  };
}

function normalizeList(value: unknown): ChargeListItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeListItem(item))
      .filter((item): item is ChargeListItem => item !== null);
  }
  if (value && typeof value === 'object' && 'pageItems' in value) {
    return normalizeList((value as { pageItems?: unknown }).pageItems);
  }
  return [];
}

function normalizeGlAccountOptions(value: unknown) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  return {
    incomeAccountOptions: Array.isArray(row.incomeAccountOptions)
      ? row.incomeAccountOptions
      : undefined,
    liabilityAccountOptions: Array.isArray(row.liabilityAccountOptions)
      ? row.liabilityAccountOptions
      : undefined
  };
}

export function normalizeChargeTemplate(raw: unknown): ChargeTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const currency = asCurrency(row.currency);
  const paymentModeOptions = row.chargePaymentModeOptions ?? row.chargePaymetModeOptions;

  return {
    ...(row as ChargeTemplate),
    id: Number.isFinite(Number(row.id)) ? Number(row.id) : undefined,
    name: typeof row.name === 'string' ? row.name : undefined,
    active: typeof row.active === 'boolean' ? row.active : undefined,
    penalty: typeof row.penalty === 'boolean' ? row.penalty : undefined,
    amount: typeof row.amount === 'number' ? row.amount : undefined,
    minCap: typeof row.minCap === 'number' ? row.minCap : undefined,
    maxCap: typeof row.maxCap === 'number' ? row.maxCap : undefined,
    feeInterval: typeof row.feeInterval === 'number' ? row.feeInterval : undefined,
    currency,
    currencyCode:
      currency?.code ?? (typeof row.currencyCode === 'string' ? row.currencyCode : undefined),
    feeOnMonthDay:
      typeof row.feeOnMonthDay === 'string' || Array.isArray(row.feeOnMonthDay)
        ? (row.feeOnMonthDay as string | number[])
        : undefined,
    chargeAppliesTo: asEnumOption(row.chargeAppliesTo),
    chargeTimeType: asEnumOption(row.chargeTimeType),
    chargeCalculationType: asEnumOption(row.chargeCalculationType),
    chargePaymentMode: asEnumOption(row.chargePaymentMode),
    feeFrequency: asEnumOption(row.feeFrequency),
    incomeOrLiabilityAccount:
      row.incomeOrLiabilityAccount && typeof row.incomeOrLiabilityAccount === 'object'
        ? (row.incomeOrLiabilityAccount as ChargeTemplate['incomeOrLiabilityAccount'])
        : undefined,
    taxGroup:
      row.taxGroup && typeof row.taxGroup === 'object'
        ? (row.taxGroup as ChargeTemplate['taxGroup'])
        : undefined,
    useChargeTiers: row.useChargeTiers === true,
    chargeTiers: normalizeChargeTiers(row.chargeTiers),
    chargeAppliesToOptions: asEnumOptions(row.chargeAppliesToOptions),
    currencyOptions: asCurrencyOptions(row.currencyOptions),
    loanChargeCalculationTypeOptions: asEnumOptions(row.loanChargeCalculationTypeOptions),
    savingsChargeCalculationTypeOptions: asEnumOptions(row.savingsChargeCalculationTypeOptions),
    clientChargeCalculationTypeOptions: asEnumOptions(row.clientChargeCalculationTypeOptions),
    shareChargeCalculationTypeOptions: asEnumOptions(row.shareChargeCalculationTypeOptions),
    loanChargeTimeTypeOptions: asEnumOptions(row.loanChargeTimeTypeOptions),
    savingsChargeTimeTypeOptions: asEnumOptions(row.savingsChargeTimeTypeOptions),
    clientChargeTimeTypeOptions: asEnumOptions(row.clientChargeTimeTypeOptions),
    shareChargeTimeTypeOptions: asEnumOptions(row.shareChargeTimeTypeOptions),
    chargePaymentModeOptions: asEnumOptions(paymentModeOptions),
    feeFrequencyOptions: asEnumOptions(row.feeFrequencyOptions),
    taxGroupOptions: asTaxGroupOptions(row.taxGroupOptions),
    incomeOrLiabilityAccountOptions: normalizeGlAccountOptions(row.incomeOrLiabilityAccountOptions),
    paymentTypeOptions: asEnumOptions(row.paymentTypeOptions),
    enableFreeWithdrawalCharge: row.enableFreeWithdrawalCharge === true,
    freeWithdrawalFrequency: asFiniteNumber(row.freeWithdrawalFrequency),
    restartCountFrequency: asFiniteNumber(row.restartCountFrequency),
    countFrequencyType: asEnumOption(row.countFrequencyType) ?? asCountFrequency(row.countFrequencyType),
    enablePaymentType: row.enablePaymentType === true,
    paymentTypeId:
      asFiniteNumber(row.paymentTypeId) ??
      asEnumOption(row.paymentType)?.id
  };
}

function asFiniteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asCountFrequency(value: unknown): ChargeTemplate['countFrequencyType'] {
  const id = asFiniteNumber(value);
  if (id == null || id < 0 || id > 3) {
    return undefined;
  }
  return { id };
}

async function enrichChargeTemplate(template: ChargeTemplate): Promise<ChargeTemplate> {
  const fineract = await createFineractClient();
  const [paymentTypes, workingCapitalRaw] = await Promise.all([
    template.paymentTypeOptions?.length
      ? Promise.resolve(null)
      : listOrganizationPaymentTypes().catch(() => []),
    fineract
      .get<unknown>('/charges/template', { chargeAppliesTo: '5', chargeTimeType: '2' })
      .catch(() => null)
  ]);
  const workingCapital = workingCapitalRaw ? normalizeChargeTemplate(workingCapitalRaw) : undefined;
  return {
    ...template,
    paymentTypeOptions: template.paymentTypeOptions?.length
      ? template.paymentTypeOptions
      : (paymentTypes ?? []).map((item) => ({ id: item.id, name: item.name })),
    workingCapitalChargeTimeTypeOptions:
      workingCapital?.loanChargeTimeTypeOptions ??
      workingCapital?.workingCapitalChargeTimeTypeOptions,
    workingCapitalChargeCalculationTypeOptions:
      workingCapital?.loanChargeCalculationTypeOptions ??
      workingCapital?.workingCapitalChargeCalculationTypeOptions
  };
}

export async function listCharges(): Promise<ChargeListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/charges');
  return normalizeList(data);
}

export async function getChargeTemplate(): Promise<ChargeTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/charges/template');
  return normalizeChargeTemplate(raw);
}

export async function getChargeFormTemplate(includeCurrencyCode?: string): Promise<ChargeTemplate> {
  const [template, selectedCurrencies] = await Promise.all([
    getChargeTemplate(),
    getOrganizationSelectedCurrencies()
  ]);
  const enriched = await enrichChargeTemplate(template);

  return {
    ...enriched,
    currencyOptions: filterCurrencyOptionsBySelected(
      template.currencyOptions ?? [],
      selectedCurrencies,
      includeCurrencyCode
    )
  };
}

export async function getCharge(chargeId: string | number): Promise<ChargeDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/charges/${chargeId}`);
  const item = normalizeListItem(raw);
  if (!item) {
    throw new Error('Charge not found.');
  }
  const row = raw as Record<string, unknown>;
  return {
    ...item,
    minCap: typeof row.minCap === 'number' ? row.minCap : undefined,
    maxCap: typeof row.maxCap === 'number' ? row.maxCap : undefined,
    feeInterval: typeof row.feeInterval === 'number' ? row.feeInterval : undefined,
    feeFrequency: asEnumOption(row.feeFrequency),
    feeOnMonthDay:
      typeof row.feeOnMonthDay === 'string' || Array.isArray(row.feeOnMonthDay)
        ? (row.feeOnMonthDay as string | number[])
        : undefined,
    incomeOrLiabilityAccount:
      row.incomeOrLiabilityAccount && typeof row.incomeOrLiabilityAccount === 'object'
        ? (row.incomeOrLiabilityAccount as ChargeDetail['incomeOrLiabilityAccount'])
        : undefined,
    taxGroup:
      row.taxGroup && typeof row.taxGroup === 'object'
        ? (row.taxGroup as ChargeDetail['taxGroup'])
        : undefined,
    useChargeTiers: row.useChargeTiers === true,
    chargeTiers: normalizeChargeTiers(row.chargeTiers)
  };
}

export async function getChargeForEdit(chargeId: string | number): Promise<ChargeTemplate> {
  const fineract = await createFineractClient();

  try {
    const raw = await fineract.get<unknown>(`/charges/${chargeId}`, { template: 'true' });
    return enrichChargeTemplate(normalizeChargeTemplate(raw));
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      throw err;
    }
  }

  const [template, charge] = await Promise.all([
    getChargeFormTemplate(),
    getCharge(chargeId)
  ]);

  return enrichChargeTemplate(
    normalizeChargeTemplate({
      ...template,
      ...charge,
      id: charge.id,
      currencyCode: charge.currency?.code ?? charge.currencyCode,
      incomeOrLiabilityAccount: charge.incomeOrLiabilityAccount
    })
  );
}

export async function createChargeRecord(
  input: UpsertChargeInput
): Promise<ChargeMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<ChargeMutationResponse>('/charges', buildChargePayload(input));
}

export async function updateChargeRecord(
  chargeId: string | number,
  input: UpsertChargeInput
): Promise<ChargeMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<ChargeMutationResponse>(`/charges/${chargeId}`, buildChargePayload(input));
}

export async function deleteChargeRecord(chargeId: string | number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/charges/${chargeId}`);
}

export function chargeInputFromTemplate(template: ChargeTemplate): UpsertChargeInput {
  const useChargeTiers = template.useChargeTiers === true;
  const time = template.chargeTimeType?.id ?? 0;
  const calculation = template.chargeCalculationType?.id ?? 0;
  const savings = template.chargeAppliesTo?.id === 2;
  const monthDay =
    time === 6 || time === 7 ? feeOnMonthDayFromCharge(template.feeOnMonthDay) : '';
  const capsStored = !useChargeTiers && calculation === 2;
  return {
    chargeAppliesTo: template.chargeAppliesTo?.id ?? 0,
    name: template.name ?? '',
    currencyCode: template.currencyCode ?? template.currency?.code ?? '',
    chargeTimeType: time,
    chargeCalculationType: calculation,
    amount: useChargeTiers ? 0 : (template.amount ?? 0),
    active: template.active ?? false,
    penalty: template.penalty ?? false,
    chargePaymentMode: template.chargeAppliesTo?.id === 1 ? template.chargePaymentMode?.id : undefined,
    incomeAccountId: template.incomeOrLiabilityAccount?.id,
    taxGroupId: template.taxGroup?.id,
    minCap: capsStored ? template.minCap : undefined,
    maxCap: capsStored ? template.maxCap : undefined,
    feeInterval: template.feeInterval,
    feeFrequency: time === 9 ? template.feeFrequency?.id : undefined,
    feeOnMonthDay: monthDay || undefined,
    addFeeFrequency: time === 9 && Boolean(template.feeInterval && template.feeFrequency),
    enableFreeWithdrawalCharge: savings ? template.enableFreeWithdrawalCharge === true : undefined,
    freeWithdrawalFrequency: savings ? template.freeWithdrawalFrequency : undefined,
    restartCountFrequency: savings ? template.restartCountFrequency : undefined,
    countFrequencyType: savings ? template.countFrequencyType?.id : undefined,
    enablePaymentType: savings ? template.enablePaymentType === true : undefined,
    paymentTypeId: savings ? template.paymentTypeId : undefined,
    useChargeTiers,
    chargeTiers: useChargeTiers
      ? (template.chargeTiers ?? []).map((tier) => ({
          amountRangeFrom: tier.amountRangeFrom ?? 0,
          amountRangeTo: tier.amountRangeTo ?? null,
          amount: tier.amount ?? 0
        }))
      : []
  };
}

/** Wizard draft — omits unset numeric fields on create. */
type ChargeWizardDraftSeed = Partial<UpsertChargeInput> & Pick<UpsertChargeInput, 'active' | 'penalty'>;

export function chargeWizardDraftFromTemplate(
  mode: 'create' | 'edit',
  template: ChargeTemplate
): ChargeWizardDraftSeed {
  if (mode === 'create') {
    return {
      active: true,
      penalty: false,
      name: '',
      currencyCode: '',
      addFeeFrequency: false,
      useChargeTiers: false,
      chargeTiers: []
    };
  }
  const input = chargeInputFromTemplate(template);
  return {
    ...input,
    chargeAppliesTo: template.chargeAppliesTo?.id,
    chargeTimeType: template.chargeTimeType?.id,
    chargeCalculationType: template.chargeCalculationType?.id,
    amount: template.amount,
    taxGroupId: template.taxGroup?.id ?? input.taxGroupId
  };
}
