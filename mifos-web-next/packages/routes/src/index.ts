/**
 * Client-safe exports — no derive-auth or parity helpers.
 * Server/middleware code should import from `@mifos/routes/server`.
 */
export { APP_ROUTES, type AppRouteId, type AppRoutePath } from './app-routes';
export type { RouteDefinition, RouteKind, RouteParity, ParityStatus } from './types';
export {
  getAllRoutes,
  getRouteById,
  getRouteByPath,
  routePath,
  isAppRoutePath
} from './registry';
