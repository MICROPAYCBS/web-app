/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_ROUTES } from '@mifos/routes';
import type { RouteDefinition } from '@mifos/routes';

export interface DashboardActivity {
  id: string;
  label: string;
  path: string;
  searchText: string;
}

function activitySearchText(route: RouteDefinition): string {
  const parts = [route.label, ...(route.keywords ?? [])];
  return parts.join(' ').toLowerCase();
}

/** Quick navigation entries derived from shipped routes (legacy activity search). */
export function buildDashboardActivities(): DashboardActivity[] {
  return (Object.values(APP_ROUTES) as RouteDefinition[])
    .filter(
      (route) =>
        route.kind === 'page' &&
        route.parity.status === 'done' &&
        route.path !== '/' &&
        route.path.length > 0
    )
    .map((route) => ({
      id: route.id,
      label: route.label,
      path: route.path,
      searchText: activitySearchText(route)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export interface DashboardShortcut {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

export function buildDashboardShortcuts(): DashboardShortcut[] {
  return (Object.values(APP_ROUTES) as RouteDefinition[])
    .filter((route) => route.navFeatured === true && route.kind === 'page')
    .sort((a, b) => (a.navFeaturedOrder ?? 0) - (b.navFeaturedOrder ?? 0))
    .map((route) => ({
      id: route.id,
      label: route.label,
      path: route.path,
      icon: route.navIcon
    }));
}
