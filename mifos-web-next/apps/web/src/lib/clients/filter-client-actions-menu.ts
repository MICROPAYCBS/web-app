/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, type SessionUser } from '@mifos/auth';
import type { ClientActionsMenuEntry } from '@/lib/clients/client-actions-menu-config';
import type { ClientActionSheetId } from '@/lib/clients/client-action-types';
import {
  hasPendingCheckerAction,
  type ResourcePendingCheckerAction
} from '@/lib/fineract/resource-pending-checker-display';

function isMenuEntryPermitted(
  entry: ClientActionsMenuEntry,
  user: SessionUser | null,
  rbacEnabled: boolean
): boolean {
  if (entry.kind === 'separator') {
    return true;
  }
  if (!rbacEnabled || !entry.permission) {
    return true;
  }
  return can(user, entry.permission);
}

function isPendingCheckerHidden(
  entry: ClientActionsMenuEntry,
  pendingCheckerActions: ResourcePendingCheckerAction[]
): boolean {
  if (entry.kind !== 'sheet' || entry.id !== 'activate') {
    return false;
  }
  return hasPendingCheckerAction(pendingCheckerActions, 'ACTIVATE');
}

export function collapseMenuSeparators(
  entries: ClientActionsMenuEntry[]
): ClientActionsMenuEntry[] {
  const collapsed: ClientActionsMenuEntry[] = [];

  for (const entry of entries) {
    if (entry.kind === 'separator') {
      if (collapsed.length === 0) {
        continue;
      }
      if (collapsed[collapsed.length - 1]?.kind === 'separator') {
        continue;
      }
      collapsed.push(entry);
      continue;
    }
    collapsed.push(entry);
  }

  while (collapsed.length > 0 && collapsed[collapsed.length - 1]?.kind === 'separator') {
    collapsed.pop();
  }

  return collapsed;
}

export function filterClientActionsMenuItems(
  entries: ClientActionsMenuEntry[],
  options: {
    user: SessionUser | null;
    rbacEnabled: boolean;
    pendingCheckerActions?: ResourcePendingCheckerAction[];
    excludeSheetIds?: ClientActionSheetId[];
  }
): ClientActionsMenuEntry[] {
  const pendingCheckerActions = options.pendingCheckerActions ?? [];
  const excludeSheetIds = new Set(options.excludeSheetIds ?? []);

  const permitted = entries.filter((entry) => {
    if (entry.kind === 'separator') {
      return true;
    }
    if (!isMenuEntryPermitted(entry, options.user, options.rbacEnabled)) {
      return false;
    }
    if (isPendingCheckerHidden(entry, pendingCheckerActions)) {
      return false;
    }
    if (entry.kind === 'sheet' && excludeSheetIds.has(entry.sheetId)) {
      return false;
    }
    return true;
  });

  return collapseMenuSeparators(permitted);
}
