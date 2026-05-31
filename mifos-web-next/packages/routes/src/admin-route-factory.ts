/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { NavGroupId, NavIcon, RouteDefinition } from './types';

export interface AdminRouteInput {
  id: string;
  path: string;
  label: string;
  navGroup: NavGroupId;
  webAppRef: string;
  permissionKey: string;
  navOrder: number;
  navIcon?: NavIcon;
  keywords?: string[];
  domain?: string;
}

/** Admin/config list screen — nav + Quick Find, page implementation deferred. */
export function defineAdminRoute(input: AdminRouteInput): RouteDefinition {
  const segment = input.path.split('/').filter(Boolean)[0];
  return {
    id: input.id,
    path: input.path,
    kind: 'page',
    label: input.label,
    domain: input.domain ?? segment ?? 'admin',
    nav: true,
    navOrder: input.navOrder,
    navGroup: input.navGroup,
    navIcon: input.navIcon,
    keywords: input.keywords ?? [],
    permissionKey: input.permissionKey,
    requiresServer: true,
    requiresAuth: true,
    parity: {
      status: 'todo',
      webAppRef: input.webAppRef
    }
  };
}

export function adminRoutesToRecord(
  entries: AdminRouteInput[]
): Record<string, RouteDefinition> {
  const record: Record<string, RouteDefinition> = {};
  for (const entry of entries) {
    record[entry.id] = defineAdminRoute(entry);
  }
  return record;
}
