import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractNotification } from '@mifos/api-client';
import { centerDetailPath } from '@/lib/fineract/center-paths';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { clientGeneralPath } from '@/lib/fineract/client-action-paths';
import { formatAuditTrailFilterLabel } from '@/lib/fineract/audit-trail-display';
import { parseFineractDateTimeString } from '@/lib/fineract/dates';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import { groupGeneralPath } from '@/lib/fineract/group-paths';
import { getSavingsAccount } from '@/lib/fineract/savings-accounts';

export type EnrichedNotification = FineractNotification & {
  href?: string;
  hrefLabel?: string;
  displayContent: string;
  displayTime?: string;
};

function titleCaseWords(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatNotificationContent(notification: FineractNotification): string {
  if (notification.content?.trim()) {
    return notification.content.trim();
  }

  const action = notification.action ? formatAuditTrailFilterLabel(notification.action) : 'Update';
  const objectType = notification.objectType
    ? formatAuditTrailFilterLabel(notification.objectType)
    : 'record';
  return `${action} · ${objectType}`;
}

export function formatNotificationTime(createdAt?: string): string | undefined {
  if (!createdAt?.trim()) {
    return undefined;
  }
  const parsed = parseFineractDateTimeString(createdAt);
  if (!parsed) {
    return createdAt;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
}

function normalizeObjectType(objectType?: string): string {
  return objectType?.trim().toLowerCase().replace(/\s+/g, '') ?? '';
}

async function resolveAccountHref(
  kind: 'loan' | 'savings',
  accountId: number
): Promise<{ href: string; hrefLabel: string } | undefined> {
  if (kind === 'loan') {
    const loan = await getLoanAccount(accountId).catch(() => null);
    if (loan?.clientId == null) {
      return undefined;
    }
    return {
      href: clientAccountGeneralPath(loan.clientId, 'loan', accountId),
      hrefLabel: 'Open loan account'
    };
  }

  const account = await getSavingsAccount(accountId).catch(() => null);
  if (account?.clientId == null) {
    return undefined;
  }
  return {
    href: clientAccountGeneralPath(account.clientId, 'savings', accountId),
    hrefLabel: 'Open savings account'
  };
}

export async function resolveNotificationLink(
  notification: FineractNotification
): Promise<{ href?: string; hrefLabel?: string }> {
  const objectId = notification.objectId;
  if (objectId == null || !Number.isFinite(objectId)) {
    return {};
  }

  switch (normalizeObjectType(notification.objectType)) {
    case 'client':
      return { href: clientGeneralPath(objectId), hrefLabel: 'Open customer' };
    case 'group':
      return { href: groupGeneralPath(objectId), hrefLabel: 'Open group' };
    case 'center':
      return { href: centerDetailPath(objectId), hrefLabel: 'Open center' };
    case 'loan': {
      const link = await resolveAccountHref('loan', objectId);
      return link ?? {};
    }
    case 'savingsaccount': {
      const link = await resolveAccountHref('savings', objectId);
      return link ?? {};
    }
    default:
      return {};
  }
}

export async function enrichNotification(
  notification: FineractNotification
): Promise<EnrichedNotification> {
  const link = await resolveNotificationLink(notification);
  return {
    ...notification,
    ...link,
    displayContent: formatNotificationContent(notification),
    displayTime: formatNotificationTime(notification.createdAt)
  };
}

export async function enrichNotifications(
  notifications: FineractNotification[]
): Promise<EnrichedNotification[]> {
  return Promise.all(notifications.map((item) => enrichNotification(item)));
}

export function formatNotificationObjectLabel(notification: FineractNotification): string {
  const objectType = notification.objectType?.trim();
  if (!objectType) {
    return 'Record';
  }
  return titleCaseWords(objectType.replace(/([a-z0-9])([A-Z])/g, '$1 $2'));
}
