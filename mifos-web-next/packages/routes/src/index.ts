/**
 * Client-safe exports — no derive-auth or parity helpers.
 * Server/middleware code should import from `@mifos/routes/server`.
 */
export { APP_ROUTES, type AppRouteId, type AppRoutePath } from './app-routes';
export type { RouteDefinition, RouteKind, RouteParity, ParityStatus, NavIcon } from './types';
export { NAV_ICON_NAMES } from './nav-icons';
export {
  getAllRoutes,
  getRouteById,
  getRouteByPath,
  routePath,
  isAppRoutePath
} from './registry';
export { findRouteByPath } from './resolve-route';
