import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractNotification, FineractNotificationsPage } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const NOTIFICATIONS_PATH = '/notifications';

function normalizeNotification(raw: unknown): FineractNotification | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    objectType: typeof row.objectType === 'string' ? row.objectType : undefined,
    objectId: Number.isFinite(Number(row.objectId)) ? Number(row.objectId) : undefined,
    action: typeof row.action === 'string' ? row.action : undefined,
    actorId: Number.isFinite(Number(row.actorId)) ? Number(row.actorId) : undefined,
    content: typeof row.content === 'string' ? row.content : undefined,
    isRead: row.isRead === true,
    isSystemGenerated: row.isSystemGenerated === true,
    tenantIdentifier:
      typeof row.tenantIdentifier === 'string' ? row.tenantIdentifier : undefined,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : undefined,
    officeId: Number.isFinite(Number(row.officeId)) ? Number(row.officeId) : undefined,
    userIds: Array.isArray(row.userIds)
      ? row.userIds
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : undefined
  };
}

function normalizeNotificationsPage(raw: unknown): FineractNotificationsPage {
  if (!raw || typeof raw !== 'object') {
    return { totalFilteredRecords: 0, pageItems: [] };
  }
  const row = raw as Record<string, unknown>;
  const totalFilteredRecords = Number(row.totalFilteredRecords);
  const pageItems = Array.isArray(row.pageItems)
    ? row.pageItems
        .map((item) => normalizeNotification(item))
        .filter((item): item is FineractNotification => item !== null)
    : [];

  return {
    totalFilteredRecords: Number.isFinite(totalFilteredRecords) ? totalFilteredRecords : pageItems.length,
    pageItems
  };
}

export async function listNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<FineractNotificationsPage> {
  const fineract = await createFineractClient();
  const params: Record<string, string> = {
    isRead: options?.unreadOnly === false ? 'true' : 'false'
  };
  if (options?.limit != null) {
    params.limit = String(options.limit);
  }
  if (options?.offset != null) {
    params.offset = String(options.offset);
  }

  const raw = await fineract.get<unknown>(NOTIFICATIONS_PATH, params);
  return normalizeNotificationsPage(raw);
}

export async function getNotificationsUnreadCount(): Promise<number> {
  const page = await listNotifications({ unreadOnly: true, limit: 1, offset: 0 });
  return page.totalFilteredRecords;
}

export async function markAllNotificationsRead(): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put<void>(NOTIFICATIONS_PATH, {});
}
