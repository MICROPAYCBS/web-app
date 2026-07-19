/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_ROUTES } from './app-routes';
import type { RouteDefinition } from './types';

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }
  const trimmed = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return trimmed || '/';
}

/** Lookup a registered page route by pathname (exact match). */
export function findRouteByPath(pathname: string): RouteDefinition | undefined {
  const normalized = normalizePathname(pathname);
  return Object.values(APP_ROUTES).find(
    (route) => route.kind === 'page' && route.path === normalized
  );
}
