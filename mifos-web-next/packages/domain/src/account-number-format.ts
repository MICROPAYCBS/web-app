/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const ACCOUNT_NUMBER_FORMAT_MAX_LENGTH = 34;

export const FORMAT_SEGMENT_PATTERN = /^(\{\w+:\d+\})+$/;

export interface FormatSegmentRow {
  token: string;
  width: number;
}

export function segmentsToPattern(rows: FormatSegmentRow[]): string {
  return rows.map((row) => `{${row.token}:${row.width}}`).join('');
}

export function patternToSegments(pattern: string): FormatSegmentRow[] {
  const segments: FormatSegmentRow[] = [];
  const regex = /\{(\w+):(\d+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(pattern)) !== null) {
    segments.push({ token: match[1], width: Number(match[2]) });
  }
  return segments;
}

export function patternTotalWidth(pattern: string): number {
  return patternToSegments(pattern).reduce((sum, segment) => sum + segment.width, 0);
}

export function patternIncludesOfficeCode(pattern: string): boolean {
  return /\{officeCode:\d+\}/.test(pattern);
}

export function patternIncludesSequence(pattern: string): boolean {
  return /\{sequence:\d+\}/.test(pattern);
}

export function countSequenceSegments(pattern: string): number {
  return (pattern.match(/\{sequence:\d+\}/g) ?? []).length;
}

export function defaultPatternForAccountType(accountTypeId: number): {
  formatPattern: string;
  sequenceScope: number;
  checkDigitAlgorithm: number;
} | null {
  switch (accountTypeId) {
    case 1:
      return {
        formatPattern: '{officeCode:3}{clientTypeCode:1}{sequence:8}{checkDigit:1}',
        sequenceScope: 2,
        checkDigitAlgorithm: 1
      };
    case 2:
    case 3:
    case 6:
    case 7:
      return {
        formatPattern: '{officeCode:3}{productCode:2}{sequence:9}{checkDigit:1}',
        sequenceScope: 3,
        checkDigitAlgorithm: 1
      };
    case 4:
    case 5:
      return {
        formatPattern: '{officeCode:3}{entityTypeCode:1}{sequence:7}{checkDigit:1}',
        sequenceScope: 2,
        checkDigitAlgorithm: 1
      };
    default:
      return null;
  }
}

export function accountTypeUsesProductShortName(accountTypeId: number): boolean {
  return [2, 3, 6, 7].includes(accountTypeId);
}

export function accountTypeUsesClientTypeLabel(accountTypeId: number): boolean {
  return accountTypeId === 1;
}

const PRODUCT_SEGMENT_TOKENS = new Set(['productCode']);
const CLIENT_SEGMENT_TOKENS = new Set(['clientTypeCode']);
const ENTITY_SEGMENT_TOKENS = new Set(['entityTypeCode']);

/** OFFICE_PRODUCT — not used for client, center, or group defaults. */
const OFFICE_PRODUCT_SEQUENCE_SCOPE_ID = 3;

export function segmentTokenOptionsForAccountType(
  accountTypeId: number | undefined,
  tokens: string[]
): string[] {
  if (!Number.isFinite(accountTypeId)) {
    return tokens;
  }

  return tokens.filter((token) => {
    switch (accountTypeId) {
      case 1:
        return !PRODUCT_SEGMENT_TOKENS.has(token) && !ENTITY_SEGMENT_TOKENS.has(token);
      case 2:
      case 3:
      case 6:
      case 7:
        return !CLIENT_SEGMENT_TOKENS.has(token) && !ENTITY_SEGMENT_TOKENS.has(token);
      case 4:
      case 5:
        return !PRODUCT_SEGMENT_TOKENS.has(token) && !CLIENT_SEGMENT_TOKENS.has(token);
      default:
        return true;
    }
  });
}

export function sequenceScopeAllowedForAccountType(
  accountTypeId: number | undefined,
  sequenceScopeId: number
): boolean {
  if (accountTypeId == null || !Number.isFinite(accountTypeId)) {
    return true;
  }
  if (sequenceScopeId === OFFICE_PRODUCT_SEQUENCE_SCOPE_ID) {
    return [2, 3, 6, 7].includes(accountTypeId);
  }
  return true;
}

export interface AccountNumberFormatPreviewQuery {
  accountType: number;
  officeId?: number;
  productShortName?: string;
  clientTypeLabel?: string;
  formatPattern?: string;
  sequenceScope?: number;
  checkDigitAlgorithm?: number;
}

export function buildAccountNumberFormatPreviewSearchParams(
  query: AccountNumberFormatPreviewQuery
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('accountType', String(query.accountType));
  if (query.officeId != null) {
    params.set('officeId', String(query.officeId));
  }
  if (query.productShortName?.trim()) {
    params.set('productShortName', query.productShortName.trim());
  }
  if (query.clientTypeLabel?.trim()) {
    params.set('clientTypeLabel', query.clientTypeLabel.trim());
  }
  if (query.formatPattern?.trim()) {
    params.set('formatPattern', query.formatPattern.trim());
  }
  if (query.sequenceScope != null) {
    params.set('sequenceScope', String(query.sequenceScope));
  }
  if (query.checkDigitAlgorithm != null) {
    params.set('checkDigitAlgorithm', String(query.checkDigitAlgorithm));
  }
  return params;
}
