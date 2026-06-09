/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEnumOption,
  FineractOfficeOption,
  StandingInstructionAccountRef,
  StandingInstructionClientRef,
  StandingInstructionTemplate
} from '@mifos/api-client';

function asEnumOptions(value: unknown): FineractEnumOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): FineractEnumOption | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      if (!Number.isFinite(id)) {
        return null;
      }
      const description =
        typeof row.description === 'string' ? row.description : undefined;
      return {
        id,
        code: typeof row.code === 'string' ? row.code : undefined,
        value:
          typeof row.value === 'string'
            ? row.value
            : description,
        name:
          typeof row.name === 'string'
            ? row.name
            : description
      };
    })
    .filter((item): item is FineractEnumOption => item !== null);
}

function asAccountOptions(value: unknown): StandingInstructionAccountRef[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item): StandingInstructionAccountRef | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id ?? row.accountId);
      if (!Number.isFinite(id)) {
        return null;
      }
      return {
        id,
        accountNo:
          typeof row.accountNo === 'string'
            ? row.accountNo
            : typeof row.accountNumber === 'string'
              ? row.accountNumber
              : undefined,
        productName:
          typeof row.productName === 'string'
            ? row.productName
            : typeof row.product === 'string'
              ? row.product
              : undefined
      };
    })
    .filter((item): item is StandingInstructionAccountRef => item !== null);
}

function asOfficeOptions(value: unknown): FineractOfficeOption[] {
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
      const name = typeof row.name === 'string' ? row.name : undefined;
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name } satisfies FineractOfficeOption;
    })
    .filter((item): item is FineractOfficeOption => item !== null);
}

function asClientOptions(value: unknown): StandingInstructionClientRef[] {
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
        displayName:
          typeof row.displayName === 'string'
            ? row.displayName
            : typeof row.name === 'string'
              ? row.name
              : undefined
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/** Coerce Fineract template JSON into the shape our form expects. */
export function normalizeStandingInstructionTemplate(
  raw: StandingInstructionTemplate,
  context?: { fromClientId?: string | number }
): StandingInstructionTemplate {
  const source = raw as StandingInstructionTemplate & Record<string, unknown>;
  const toClientOptions = asClientOptions(source.toClientOptions);
  const fromClientOptions = asClientOptions(source.fromClientOptions);

  let fromClient = raw.fromClient;
  if (!fromClient && context?.fromClientId != null) {
    const clientId = Number(context.fromClientId);
    if (Number.isFinite(clientId)) {
      fromClient =
        fromClientOptions.find((client) => client.id === clientId) ??
        toClientOptions.find((client) => client.id === clientId);
    }
  }

  return {
    fromClient,
    dateFormat: raw.dateFormat,
    locale: raw.locale,
    transferTypeOptions: asEnumOptions(source.transferTypeOptions),
    priorityOptions: asEnumOptions(source.priorityOptions),
    statusOptions: asEnumOptions(source.statusOptions),
    fromAccountTypeOptions: asEnumOptions(source.fromAccountTypeOptions),
    fromAccountOptions: asAccountOptions(source.fromAccountOptions),
    toOfficeOptions: asOfficeOptions(source.toOfficeOptions),
    toClientOptions,
    toAccountTypeOptions: asEnumOptions(source.toAccountTypeOptions),
    toAccountOptions: asAccountOptions(source.toAccountOptions),
    instructionTypeOptions: asEnumOptions(source.instructionTypeOptions),
    recurrenceTypeOptions: asEnumOptions(source.recurrenceTypeOptions),
    recurrenceFrequencyOptions: asEnumOptions(source.recurrenceFrequencyOptions)
  };
}
