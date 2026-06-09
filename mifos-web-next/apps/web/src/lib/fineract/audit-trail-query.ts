/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

export const AUDIT_TRAILS_DEFAULT_LIMIT = 25;

export type AuditTrailSearchFilters = {
  resourceId?: string;
  processingResult?: string;
  makerId?: string;
  actionName?: string;
  entityName?: string;
  checkerId?: string;
  makerDateTimeFrom?: string;
  makerDateTimeTo?: string;
  checkerDateTimeFrom?: string;
  checkerDateTimeTo?: string;
  dateFormat: string;
  locale: string;
};

export type AuditTrailListQuery = AuditTrailSearchFilters & {
  offset: number;
  limit: number;
  orderBy: string;
  sortOrder: string;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

export function parseAuditTrailListQuery(
  params: Record<string, string | string[] | undefined>,
  defaults?: { dateFormat?: string; locale?: string }
): AuditTrailListQuery {
  const pageIndex = Math.max(0, Number(readParam(params, 'page') ?? '0') || 0);
  const limit = Math.max(1, Number(readParam(params, 'limit') ?? String(AUDIT_TRAILS_DEFAULT_LIMIT)) || AUDIT_TRAILS_DEFAULT_LIMIT);
  const orderBy = readParam(params, 'orderBy') ?? '';
  const sortOrder = readParam(params, 'sortOrder') ?? '';

  return {
    offset: pageIndex * limit,
    limit,
    orderBy,
    sortOrder,
    resourceId: readParam(params, 'resourceId'),
    processingResult: readParam(params, 'processingResult'),
    makerId: readParam(params, 'makerId'),
    actionName: readParam(params, 'actionName'),
    entityName: readParam(params, 'entityName'),
    checkerId: readParam(params, 'checkerId'),
    makerDateTimeFrom: readParam(params, 'makerDateTimeFrom'),
    makerDateTimeTo: readParam(params, 'makerDateTimeTo'),
    checkerDateTimeFrom: readParam(params, 'checkerDateTimeFrom'),
    checkerDateTimeTo: readParam(params, 'checkerDateTimeTo'),
    dateFormat: defaults?.dateFormat ?? FINERACT_DATE_FORMAT,
    locale: defaults?.locale ?? FINERACT_LOCALE
  };
}

export function auditTrailOrderByForApi(orderBy: string): string {
  if (orderBy === 'clientIp') {
    return 'ip';
  }
  return orderBy;
}

export function buildAuditTrailSearchParams(query: AuditTrailListQuery): Record<string, string> {
  const params: Record<string, string> = {
    offset: String(query.offset),
    limit: String(query.limit),
    paged: 'true',
    sortOrder: query.sortOrder,
    orderBy: auditTrailOrderByForApi(query.orderBy),
    dateFormat: query.dateFormat,
    locale: query.locale
  };

  if (query.resourceId) {
    params.resourceId = query.resourceId;
  }
  if (query.processingResult) {
    params.processingResult = query.processingResult;
  }
  if (query.makerId) {
    params.makerId = query.makerId;
  }
  if (query.actionName) {
    params.actionName = query.actionName;
  }
  if (query.entityName) {
    params.entityName = query.entityName;
  }
  if (query.checkerId) {
    params.checkerId = query.checkerId;
  }
  if (query.makerDateTimeFrom) {
    params.makerDateTimeFrom = query.makerDateTimeFrom;
  }
  if (query.makerDateTimeTo) {
    params.makerDateTimeTo = query.makerDateTimeTo;
  }
  if (query.checkerDateTimeFrom) {
    params.checkerDateTimeFrom = query.checkerDateTimeFrom;
  }
  if (query.checkerDateTimeTo) {
    params.checkerDateTimeTo = query.checkerDateTimeTo;
  }

  return params;
}

export function auditTrailFiltersFromQuery(query: AuditTrailListQuery): AuditTrailSearchFilters {
  return {
    resourceId: query.resourceId,
    processingResult: query.processingResult,
    makerId: query.makerId,
    actionName: query.actionName,
    entityName: query.entityName,
    checkerId: query.checkerId,
    makerDateTimeFrom: query.makerDateTimeFrom,
    makerDateTimeTo: query.makerDateTimeTo,
    checkerDateTimeFrom: query.checkerDateTimeFrom,
    checkerDateTimeTo: query.checkerDateTimeTo,
    dateFormat: query.dateFormat,
    locale: query.locale
  };
}

export function combineAuditTrailDateTime(date: string | undefined, time: string | undefined): string {
  if (!date) {
    return '';
  }
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) {
    return '';
  }
  const [hours = 0, minutes = 0, seconds = 0] = (time ?? '00:00:00').split(':').map(Number);
  const value = new Date(year, month - 1, day, hours, minutes, seconds);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}Z`;
}

export function splitAuditTrailDateTime(value: string | undefined): { date: string; time: string } {
  if (!value) {
    return { date: '', time: '' };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }
  const pad = (part: number) => String(part).padStart(2, '0');
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`
  };
}
