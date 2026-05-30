/**
 * Server-only route helpers (RBAC derivation, parity matrix, nav structure).
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
export {
  buildNavStructure,
  navLinkSearchText,
  type NavStructure,
  type NavGroupSection,
  type NavLinkItem,
  type NavLinkStatus
} from './derive-nav';
export { NAV_GROUPS, getNavGroupLabel, type NavGroupDefinition } from './nav-groups';
export { buildParityMatrix, parityByDomain, paritySummary, type ParityRow } from './parity-export';
