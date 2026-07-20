/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type GlAccountEnquiryPrefixIds = {
  officeId?: number;
  departmentId?: number;
};

function positiveId(raw: string): number | undefined {
  if (!raw) {
    return undefined;
  }
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return id;
}

function digitsOnly(segment: string | undefined): string {
  return (segment ?? '').replace(/\D/g, '');
}

/**
 * Parse the GL enquiry prefix (`XX-XX`, e.g. `01-02`).
 *
 * - Full `branch-department`: first segment → office id, second → department id (as numbers).
 * - Incomplete input (no hyphen, missing segment, or not enough characters): resolve **department** first.
 */
export function parseGlAccountEnquiryPrefix(raw: string | undefined | null): GlAccountEnquiryPrefixIds {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return {};
  }

  if (!trimmed.includes('-')) {
    const id = positiveId(digitsOnly(trimmed));
    return id != null ? { departmentId: id } : {};
  }

  const [left = '', right = ''] = trimmed.split('-');
  const officeDigits = digitsOnly(left);
  const departmentDigits = digitsOnly(right);

  const officeId = positiveId(officeDigits);
  const departmentId = positiveId(departmentDigits);

  // Enough characters for both segments → branch then department.
  if (officeDigits.length > 0 && departmentDigits.length > 0) {
    return {
      ...(officeId != null ? { officeId } : {}),
      ...(departmentId != null ? { departmentId } : {})
    };
  }

  // Incomplete: prefer department (trailing segment, else the only available digits).
  if (departmentId != null) {
    return { departmentId };
  }
  if (officeId != null) {
    return { departmentId: officeId };
  }
  return {};
}

/** True when both branch and department segments resolved from a complete `XX-XX` prefix. */
export function isCompleteGlAccountEnquiryPrefix(raw: string | undefined | null): boolean {
  const parsed = parseGlAccountEnquiryPrefix(raw);
  return parsed.officeId != null && parsed.departmentId != null;
}

/**
 * When the prefix is complete (`XX-XX`), copy office and department ids into the filter fields
 * so Branch and Department selects are prefilled.
 */
export function prefillFiltersFromGlAccountEnquiryPrefix<
  T extends { glPrefix?: string; officeId?: string; departmentId?: string }
>(filters: T): T {
  const parsed = parseGlAccountEnquiryPrefix(filters.glPrefix);
  if (parsed.officeId == null || parsed.departmentId == null) {
    return filters;
  }
  return {
    ...filters,
    officeId: String(parsed.officeId),
    departmentId: String(parsed.departmentId)
  };
}
