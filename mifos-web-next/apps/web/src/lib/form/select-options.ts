/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SelectOption } from '@/components/composites/select-field';

type FineractOptionLike = {
  id: number;
  name?: string;
  value?: string;
  displayName?: string;
};

/** Human-readable label — never show raw numeric id when a name exists. */
export function fineractOptionLabel(option: FineractOptionLike): string {
  const candidate = option.displayName ?? option.name ?? option.value;
  if (candidate && candidate !== String(option.id)) {
    return candidate;
  }
  if (option.name) {
    return option.name;
  }
  if (option.value && Number.isNaN(Number(option.value))) {
    return option.value;
  }
  return `Option ${option.id}`;
}

export function humanizeEnumValue(value: string): string {
  return value
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function enumToSelectOptions(
  values: readonly string[],
  options?: {
    label?: (value: string) => string;
  }
): SelectOption[] {
  return values.map((value) => {
    const label = options?.label?.(value) ?? humanizeEnumValue(value);
    return {
      value,
      label,
      keywords: [value, label]
    };
  });
}

export function fineractEnumToSelectOptions(
  items: FineractOptionLike[] | undefined,
  labelFn?: (item: FineractOptionLike) => string
): SelectOption[] {
  if (!items?.length) {
    return [];
  }

  return items.map((item) => {
    const label = labelFn?.(item) ?? fineractOptionLabel(item);
    const id = String(item.id);
    return {
      value: id,
      label,
      keywords: [label, id, item.value, item.name].filter(Boolean) as string[]
    };
  });
}

export function toSelectOptions(
  items: FineractOptionLike[] | undefined
): SelectOption[] {
  return fineractEnumToSelectOptions(items);
}

export function labeledOptionsToSelectOptions(
  options: ReadonlyArray<{ value: string; label: string }> | undefined
): SelectOption[] {
  if (!options?.length) {
    return [];
  }

  return options.map((option) => ({
    value: option.value,
    label: option.label,
    keywords: [option.value, option.label]
  }));
}

export function roleToSelectOptions(
  roles: { id: number; name: string; disabled?: boolean }[] | undefined
): SelectOption[] {
  if (!roles?.length) {
    return [];
  }

  return roles
    .filter((role) => !role.disabled)
    .map((role) => ({
      value: String(role.id),
      label: role.name,
      keywords: [role.name, String(role.id)]
    }));
}

export function glAccountToSelectOptions(
  accounts: { id: number; glCode: string; name: string }[] | undefined,
  labelFn?: (account: { id: number; glCode: string; name: string }) => string
): SelectOption[] {
  if (!accounts?.length) {
    return [];
  }

  return accounts.map((account) => {
    const label = labelFn?.(account) ?? account.name;
    return {
      value: String(account.id),
      label,
      keywords: [account.name, account.glCode, String(account.id)]
    };
  });
}

export function clientToSelectOptions(
  clients: { id: number; displayName?: string | null }[] | undefined
): SelectOption[] {
  if (!clients?.length) {
    return [];
  }

  return clients.map((client) => {
    const name = client.displayName?.trim();
    const label = name ? `${name} (${client.id})` : `Customer ${client.id}`;
    return {
      value: String(client.id),
      label,
      keywords: [name, String(client.id)].filter(Boolean) as string[]
    };
  });
}

export function accountToSelectOptions(
  accounts:
    | { id: number; productName?: string | null; accountNo?: string | null }[]
    | undefined
): SelectOption[] {
  if (!accounts?.length) {
    return [];
  }

  return accounts.map((account) => {
    const productName = account.productName?.trim();
    const accountNo = account.accountNo?.trim();
    const label = productName
      ? `${productName} (${accountNo ?? account.id})`
      : accountNo
        ? `${accountNo} (${account.id})`
        : `Account ${account.id}`;

    return {
      value: String(account.id),
      label,
      keywords: [productName, accountNo, String(account.id)].filter(Boolean) as string[]
    };
  });
}

type CustomerClassOptionLike = {
  id: number;
  classCode?: string;
  className?: string;
};

export function customerClassToSelectOptions(
  items: CustomerClassOptionLike[] | undefined
): SelectOption[] {
  if (!items?.length) {
    return [];
  }
  return items.map((item) => {
    const label =
      item.className && item.classCode
        ? `${item.classCode} — ${item.className}`
        : (item.className ?? item.classCode ?? `Class ${item.id}`);
    return {
      value: String(item.id),
      label,
      keywords: [label, item.classCode, item.className, String(item.id)].filter(Boolean) as string[]
    };
  });
}

export function currencyToSelectOptions(
  currencies: { code?: string; name?: string }[] | undefined
): SelectOption[] {
  if (!currencies?.length) {
    return [];
  }

  return currencies
    .filter((currency): currency is { code: string; name?: string } => Boolean(currency.code?.trim()))
    .map((currency) => {
      const code = currency.code.trim().toUpperCase();
      const name = currency.name?.trim();
      return {
        value: code,
        label: name ? `${name} (${code})` : code,
        keywords: [code, name].filter(Boolean) as string[]
      };
    });
}

export function officeToSelectOptions(
  offices: { id: number; name: string; nameDecorated?: string }[] | undefined
): SelectOption[] {
  if (!offices?.length) {
    return [];
  }

  return offices.map((office) => ({
    value: String(office.id),
    label: office.nameDecorated?.trim() || office.name,
    keywords: [office.name, office.nameDecorated, String(office.id)].filter(Boolean) as string[]
  }));
}
