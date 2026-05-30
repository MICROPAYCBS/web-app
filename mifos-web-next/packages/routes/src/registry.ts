import { APP_ROUTES, type AppRouteId, type AppRoutePath } from './app-routes';
import type { RouteDefinition } from './types';

const ROUTE_LIST = Object.values(APP_ROUTES) as RouteDefinition[];

/** All registered routes. */
export function getAllRoutes(): RouteDefinition[] {
  return ROUTE_LIST;
}

export function getRouteById(id: AppRouteId): RouteDefinition {
  return APP_ROUTES[id];
}

export function getRouteByPath(path: string): RouteDefinition | undefined {
  const exact = ROUTE_LIST.find((r) => r.path === path);
  if (exact) {
    return exact;
  }
  const sorted = [...ROUTE_LIST].sort((a, b) => b.path.length - a.path.length);
  return sorted.find((r) => path.startsWith(`${r.path}/`));
}

export function routePath<Id extends AppRouteId>(id: Id): (typeof APP_ROUTES)[Id]['path'] {
  return APP_ROUTES[id].path;
}

/** Type guard: value is a known app route path */
export function isAppRoutePath(path: string): path is AppRoutePath {
  return ROUTE_LIST.some((r) => r.path === path || path.startsWith(`${r.path}/`));
}
