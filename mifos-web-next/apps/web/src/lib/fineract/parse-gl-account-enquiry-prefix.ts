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

/** Branch segment is fixed-width: first two digits identify the office. */
export const GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS = 2;

/** Same width for department in display prefixes (`01-02-…`). */
export const GL_ACCOUNT_ENQUIRY_PREFIX_DEPARTMENT_DIGITS =
  GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS;

function padPrefixSegment(id: number, width: number): string {
  return String(id).padStart(width, '0');
}

/**
 * Display GL code with branch–department prefix, e.g. office 1 + dept 2 + `100001`
 * → `01-02-100001`. Unassigned department (`0` / missing) uses `00`.
 */
export function formatGlAccountEnquiryPrefixedCode(input: {
  officeId: number | string;
  departmentId?: number | string | null;
  glCode: string;
}): string {
  const officeRaw = Number(input.officeId);
  const officeId = Number.isFinite(officeRaw) && officeRaw >= 0 ? officeRaw : 0;
  const deptRaw =
    input.departmentId == null || input.departmentId === ''
      ? 0
      : Number(input.departmentId);
  const departmentId = Number.isFinite(deptRaw) && deptRaw >= 0 ? deptRaw : 0;
  const glCode = input.glCode.trim();

  return [
    padPrefixSegment(officeId, GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS),
    padPrefixSegment(departmentId, GL_ACCOUNT_ENQUIRY_PREFIX_DEPARTMENT_DIGITS),
    glCode
  ].join('-');
}

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
 * Progressive:
 * - First **two** digits → branch (`officeId`) as soon as they are present.
 * - Remaining digits (after those two, or after `-`) → department (`departmentId`).
 *
 * Examples: `01` → office 1; `01-02` / `0102` → office 1 + department 2.
 */
export function parseGlAccountEnquiryPrefix(raw: string | undefined | null): GlAccountEnquiryPrefixIds {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return {};
  }

  const result: GlAccountEnquiryPrefixIds = {};

  if (trimmed.includes('-')) {
    const [left = '', right = ''] = trimmed.split('-');
    const officeDigits = digitsOnly(left);
    const departmentDigits = digitsOnly(right);

    if (officeDigits.length >= GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS) {
      const officeId = positiveId(officeDigits);
      if (officeId != null) {
        result.officeId = officeId;
      }
    }
    if (departmentDigits.length > 0) {
      const departmentId = positiveId(departmentDigits);
      if (departmentId != null) {
        result.departmentId = departmentId;
      }
    }
    return result;
  }

  const digits = digitsOnly(trimmed);
  if (digits.length < GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS) {
    return {};
  }

  const officeId = positiveId(digits.slice(0, GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS));
  if (officeId != null) {
    result.officeId = officeId;
  }

  if (digits.length > GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS) {
    const departmentId = positiveId(digits.slice(GL_ACCOUNT_ENQUIRY_PREFIX_BRANCH_DIGITS));
    if (departmentId != null) {
      result.departmentId = departmentId;
    }
  }

  return result;
}

/** True when both branch (2+ digits) and department segments resolved. */
export function isCompleteGlAccountEnquiryPrefix(raw: string | undefined | null): boolean {
  const parsed = parseGlAccountEnquiryPrefix(raw);
  return parsed.officeId != null && parsed.departmentId != null;
}

/**
 * Prefill Branch / Department from the prefix as the user types.
 * Branch fills once the first two digits are present; department fills from the rest.
 */
export function prefillFiltersFromGlAccountEnquiryPrefix<
  T extends { glPrefix?: string; officeId?: string; departmentId?: string }
>(filters: T): T {
  const trimmed = filters.glPrefix?.trim() ?? '';
  if (!trimmed) {
    return filters;
  }

  const parsed = parseGlAccountEnquiryPrefix(filters.glPrefix);
  const next = { ...filters };

  if (parsed.officeId != null) {
    next.officeId = String(parsed.officeId);
  }

  if (parsed.departmentId != null) {
    next.departmentId = String(parsed.departmentId);
  } else if (trimmed.includes('-')) {
    // Hyphen starts the department segment — clear dept until digits appear.
    const right = trimmed.split('-')[1] ?? '';
    if (digitsOnly(right).length === 0) {
      next.departmentId = '';
    }
  }

  return next;
}
