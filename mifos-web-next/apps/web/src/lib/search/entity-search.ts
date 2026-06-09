/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSearchResult } from '@mifos/api-client';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';

export const SEARCH_RESOURCE_ALL = 'clients,clientIdentifiers,groups,savings,shares,loans';

export const SEARCH_RESOURCE_OPTIONS = [
  { label: 'All', value: SEARCH_RESOURCE_ALL },
  { label: 'Clients', value: 'clients,clientIdentifiers' },
  { label: 'Groups', value: 'groups' },
  { label: 'Savings', value: 'savings' },
  { label: 'Shares', value: 'shares' },
  { label: 'Loans', value: 'loans' }
] as const;

export type SearchResourceValue = (typeof SEARCH_RESOURCE_OPTIONS)[number]['value'];

export const SEARCH_RESULTS_MAX = 200;
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_INLINE_MAX = 20;
/** Fixed results panel height in the search dialog (~5 two-line rows). */
export const SEARCH_DIALOG_RESULTS_HEIGHT = '17.75rem';

export type SearchResultLinkStatus = 'live' | 'soon';

export interface SearchResultTarget {
  href: string | null;
  status: SearchResultLinkStatus;
}

function clientAccountHrefFromSearch(entity: FineractSearchResult): string | null {
  if (entity.parentId == null) {
    return null;
  }
  const clientId = entity.parentId;
  const accountId = entity.entityId;

  switch (entity.entityType) {
    case 'LOAN':
      return clientAccountGeneralPath(clientId, 'loan', accountId);
    case 'SAVING':
      if (entity.subEntityType === 'depositAccountType.recurringDeposit') {
        return clientAccountGeneralPath(clientId, 'recurringDeposit', accountId);
      }
      if (entity.subEntityType === 'depositAccountType.fixedDeposit') {
        return clientAccountGeneralPath(clientId, 'fixedDeposit', accountId);
      }
      return clientAccountGeneralPath(clientId, 'savings', accountId);
    case 'SHARE':
      return clientAccountGeneralPath(clientId, 'share', accountId);
    default:
      return null;
  }
}

export function formatSearchEntityType(entityType: string): string {
  switch (entityType) {
    case 'CLIENT':
      return 'Client';
    case 'CLIENTIDENTIFIER':
      return 'Client identifier';
    case 'GROUP':
      return 'Group';
    case 'CENTER':
      return 'Center';
    case 'LOAN':
      return 'Loan';
    case 'SAVING':
      return 'Savings';
    case 'SHARE':
      return 'Shares';
    default:
      return entityType;
  }
}

export function formatSearchParentType(entity: FineractSearchResult): string {
  if (['CLIENT', 'GROUP', 'CENTER'].includes(entity.entityType)) {
    return 'Office';
  }
  return 'Client';
}

/** Best-effort link to a list or detail route (may not be a full entity detail page). */
export function searchResultHref(entity: FineractSearchResult): string | null {
  switch (entity.entityType) {
    case 'CLIENT':
      return `/clients/${entity.entityId}/general`;
    case 'CLIENTIDENTIFIER':
      return entity.parentId != null ? `/clients/${entity.parentId}/identities` : null;
    case 'CENTER':
      return '/centers';
    case 'GROUP':
      return '/groups';
    case 'SHARE':
    case 'SAVING':
    case 'LOAN':
      return clientAccountHrefFromSearch(entity);
    default:
      return null;
  }
}

/** Whether the target route is a implemented entity detail screen vs coming soon. */
export function searchResultTarget(entity: FineractSearchResult): SearchResultTarget {
  switch (entity.entityType) {
    case 'CLIENT':
      return { href: `/clients/${entity.entityId}/general`, status: 'live' };
    case 'CLIENTIDENTIFIER':
      return entity.parentId != null
        ? { href: `/clients/${entity.parentId}/identities`, status: 'live' }
        : { href: null, status: 'soon' };
    case 'LOAN':
    case 'SAVING':
    case 'SHARE': {
      const href = clientAccountHrefFromSearch(entity);
      return href ? { href, status: 'live' } : { href: null, status: 'soon' };
    }
    default:
      return { href: searchResultHref(entity), status: 'soon' };
  }
}

export function formatSearchResultLabel(entity: FineractSearchResult): string {
  const name = entity.entityName?.trim();
  if (name) {
    return name;
  }
  if (entity.entityAccountNo?.trim()) {
    return entity.entityAccountNo.trim();
  }
  if (entity.entityExternalId?.trim()) {
    return entity.entityExternalId.trim();
  }
  return `#${entity.entityId}`;
}

function appendDistinct(parts: string[], value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return;
  }
  if (!parts.includes(trimmed)) {
    parts.push(trimmed);
  }
}

/** Secondary line — account, external ID, phone, email, office/parent as available. */
export function formatSearchResultMeta(entity: FineractSearchResult): string | null {
  const parts: string[] = [];

  if (entity.entityType === 'CLIENT') {
    appendDistinct(parts, entity.entityAccountNo);
    appendDistinct(parts, entity.entityExternalId);
    appendDistinct(parts, entity.entityMobileNo);
    appendDistinct(parts, entity.entityEmail);
    appendDistinct(parts, entity.parentName);
    return parts.length ? parts.join(' · ') : null;
  }

  if (entity.entityAccountNo?.trim() && entity.entityName?.trim()) {
    appendDistinct(parts, entity.entityAccountNo);
  }
  appendDistinct(parts, entity.entityExternalId);
  appendDistinct(parts, entity.entityMobileNo);
  appendDistinct(parts, entity.entityEmail);
  if (!['CLIENT', 'GROUP', 'CENTER'].includes(entity.entityType)) {
    appendDistinct(parts, entity.parentName);
  }

  return parts.length ? parts.join(' · ') : null;
}

export function formatSearchResultMetaParts(entity: FineractSearchResult): string[] {
  const combined = formatSearchResultMeta(entity);
  return combined ? combined.split(' · ') : [];
}

export function buildSearchPageUrl(query: string, resource: string = SEARCH_RESOURCE_ALL): string {
  const params = new URLSearchParams({ query, resource });
  return `/search?${params.toString()}`;
}
