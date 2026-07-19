/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDatatableCheck } from '@mifos/api-client';

const CLIENT_ENTITY = 'm_client';

function statusCode(check: FineractEntityDatatableCheck): number | null {
  const raw = check.status?.code;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function statusLabel(check: FineractEntityDatatableCheck): string {
  return (check.status?.value ?? '').trim().toLowerCase();
}

/** Fineract client lifecycle codes commonly used in entity datatable checks. */
function isActiveClientStatus(check: FineractEntityDatatableCheck): boolean {
  const label = statusLabel(check);
  const code = statusCode(check);
  return label.includes('active') || code === 300;
}

function isPendingClientStatus(check: FineractEntityDatatableCheck): boolean {
  const label = statusLabel(check);
  const code = statusCode(check);
  return (
    label.includes('pending') ||
    label.includes('submitted') ||
    label.includes('inactive') ||
    code === 100
  );
}

function checkAppliesToCreateState(
  check: FineractEntityDatatableCheck,
  active: boolean
): boolean {
  return active ? isActiveClientStatus(check) : isPendingClientStatus(check);
}

/** Datatable names Fineract requires on POST /clients for the given create draft state. */
export function mandatoryClientDatatableNames(
  checks: FineractEntityDatatableCheck[],
  options: { active: boolean; savingsProductId?: number }
): Set<string> {
  const names = new Set<string>();

  for (const check of checks) {
    if (check.entity !== CLIENT_ENTITY) {
      continue;
    }
    if (check.productId != null && check.productId !== options.savingsProductId) {
      continue;
    }
    if (!checkAppliesToCreateState(check, options.active)) {
      continue;
    }
    if (check.datatableName?.trim()) {
      names.add(check.datatableName);
    }
  }

  return names;
}
