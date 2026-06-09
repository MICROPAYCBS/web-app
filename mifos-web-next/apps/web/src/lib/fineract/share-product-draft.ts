/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductTemplate } from '@mifos/api-client';
import type { LoanProductGlAccountOption } from '@mifos/api-client';
import type { UpsertShareProductInput } from '@mifos/validation';
import {
  filterCurrencyOptionsBySelected,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
import { filterTemplateChargeOptionsByCurrency } from '@/lib/fineract/product-charge-options';
import { SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS } from '@/lib/fineract/share-product-accounting';
import { asAccountingMappings, asCurrency, asEnumOption } from '@/lib/fineract/product-normalize';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';

function glAccountList(options: LoanProductGlAccountOption[] | null | undefined) {
  return options ?? [];
}

function normalizeAccountingMappingOptions(
  raw: ShareProductTemplate['accountingMappingOptions']
): ShareProductTemplate['accountingMappingOptions'] {
  return {
    assetAccountOptions: glAccountList(raw?.assetAccountOptions),
    incomeAccountOptions: glAccountList(raw?.incomeAccountOptions),
    liabilityAccountOptions: glAccountList(raw?.liabilityAccountOptions),
    equityAccountOptions: glAccountList(raw?.equityAccountOptions)
  };
}

function enumId(value: unknown): number | undefined {
  return asEnumOption(value)?.id;
}

function enumIdFromOptions(options: unknown, fallbackIndex = 0): number | undefined {
  if (Array.isArray(options) && options.length > 0) {
    return asEnumOption(options[fallbackIndex])?.id;
  }
  return undefined;
}

function mappingAccountId(
  mappings: Record<string, { id?: number } | undefined>,
  key: string
): number | undefined {
  const id = mappings[key]?.id;
  return Number.isFinite(id) ? id : undefined;
}

export function shareProductDraftFromTemplate(
  template: ShareProductTemplate
): UpsertShareProductInput {
  const currency = template.currency ?? template.currencyOptions?.[0];
  const accountingRuleId =
    template.accountingRule?.id ?? template.accountingRuleOptions?.[0]?.id ?? 1;
  const mappings = template.accountingMappings ?? {};
  const lockinFrequency = Number(template.lockinPeriod ?? 0);
  const hasLockin = lockinFrequency > 0;

  const marketPricePeriods = (
    template.marketPrice ??
    (Array.isArray(template.marketPricePeriods) ? template.marketPricePeriods : [])
  )
    .map((period) => ({
      fromDate: fineractApiDateToFormString(period.fromDate as string | number[] | undefined) ?? '',
      shareValue: period.shareValue ?? 0
    }))
    .filter((period) => period.fromDate && period.shareValue > 0);

  return {
    details: {
      name: template.name ?? '',
      shortName: template.shortName ?? '',
      description: template.description ?? ''
    },
    currency: {
      currencyCode: currency?.code ?? template.currencyCode ?? '',
      digitsAfterDecimal: template.digitsAfterDecimal ?? currency?.decimalPlaces ?? 2,
      inMultiplesOf: template.inMultiplesOf,
    },
    terms: {
      totalShares: template.totalShares ?? 1,
      sharesIssued: template.totalSharesIssued ?? template.totalShares ?? 1,
      unitPrice: template.unitPrice ?? 1,
      shareCapital:
        template.shareCapital ??
        (template.unitPrice != null
          ? template.unitPrice *
            (template.totalSharesIssued ?? template.totalShares ?? 1)
          : undefined)
    },
    settings: {
      minimumShares: template.minimumShares,
      nominalShares: template.nominalShares ?? 1,
      maximumShares: template.maximumShares,
      minimumActivePeriodForDividends: template.minimumActivePeriod ?? 1,
      minimumactiveperiodFrequencyType:
        enumId(template.minimumActivePeriodForDividendsTypeEnum) ??
        enumIdFromOptions(template.minimumActivePeriodFrequencyTypeOptions),
      enableLockinPeriod: hasLockin,
      lockinPeriodFrequency: hasLockin ? lockinFrequency : undefined,
      lockinPeriodFrequencyType: hasLockin
        ? (enumId(template.lockPeriodTypeEnum) ??
          enumIdFromOptions(template.lockinPeriodFrequencyTypeOptions))
        : undefined,
      allowDividendCalculationForInactiveClients: Boolean(
        template.allowDividendCalculationForInactiveClients
      )
    },
    marketPrice: {
      marketPricePeriods
    },
    charges: {
      chargeIds: (template.charges ?? []).map((c) => c.id).filter((id) => Number.isFinite(id))
    },
    accounting: {
      accountingRule: accountingRuleId,
      shareReferenceId: mappingAccountId(mappings, 'shareReferenceId'),
      shareSuspenseId: mappingAccountId(mappings, 'shareSuspenseId'),
      shareEquityId: mappingAccountId(mappings, 'shareEquityId'),
      incomeFromFeeAccountId: mappingAccountId(mappings, 'incomeFromFeeAccountId')
    }
  };
}

export async function enrichShareProductTemplate(
  template: ShareProductTemplate
): Promise<ShareProductTemplate> {
  const selected = await getOrganizationSelectedCurrencies();
  const currencyOptions = filterCurrencyOptionsBySelected(
    template.currencyOptions ?? [],
    selected,
    template.currencyCode ?? template.currency?.code
  );
  return filterTemplateChargeOptionsByCurrency({
    ...template,
    currencyOptions,
    accountingRuleOptions:
      template.accountingRuleOptions?.length
        ? template.accountingRuleOptions
        : SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS,
    accountingMappingOptions: normalizeAccountingMappingOptions(template.accountingMappingOptions)
  });
}

function normalizeMarketPriceFromRow(row: Record<string, unknown>) {
  const raw = row.marketPrice ?? row.marketPricePeriods;
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const period = item as Record<string, unknown>;
      return {
        fromDate: typeof period.fromDate === 'string' ? period.fromDate : undefined,
        shareValue: typeof period.shareValue === 'number' ? period.shareValue : undefined
      };
    });
}

export function normalizeShareProductTemplate(raw: unknown): ShareProductTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const accountingMappingOptions = normalizeAccountingMappingOptions(
    row.accountingMappingOptions && typeof row.accountingMappingOptions === 'object'
      ? (row.accountingMappingOptions as ShareProductTemplate['accountingMappingOptions'])
      : undefined
  );

  return {
    ...(row as ShareProductTemplate),
    currency: asCurrency(row.currency),
    accountingMappings: asAccountingMappings(row.accountingMappings),
    accountingMappingOptions,
    accountingRuleOptions: Array.isArray(row.accountingRuleOptions)
      ? (row.accountingRuleOptions as ShareProductTemplate['accountingRuleOptions'])
      : SHARE_PRODUCT_ACCOUNTING_RULE_OPTIONS,
    marketPrice: normalizeMarketPriceFromRow(row),
    accountingRule: asEnumOption(row.accountingRule),
    minimumActivePeriodForDividendsTypeEnum: asEnumOption(
      row.minimumActivePeriodForDividendsTypeEnum
    ),
    lockPeriodTypeEnum: asEnumOption(row.lockPeriodTypeEnum)
  };
}
