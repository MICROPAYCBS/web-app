/**
 * Server-only route helpers (RBAC derivation, parity matrix).
 * Do not import from client components — use `@mifos/routes` for routePath / APP_ROUTES.
 */
export {
  buildNavManifest,
  buildRouteManifest,
  buildPublicPathPrefixes,
  resolveRoutePermissionKey,
  routeRequiresServer,
  routeRequiresAuth,
  type DerivedNavItem,
  type DerivedRouteRule
} from './derive-auth';
export { buildParityMatrix, parityByDomain, paritySummary, type ParityRow } from './parity-export';
