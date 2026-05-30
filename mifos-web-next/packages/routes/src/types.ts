export type RouteKind = 'page' | 'api' | 'layout';

export type ParityStatus = 'todo' | 'in_progress' | 'done' | 'n/a';

export interface RouteParity {
  status: ParityStatus;
  /** e.g. openMF/web-app → src/app/clients/ */
  webAppRef?: string;
  /** Primary Fineract API for the screen */
  fineractApi?: string;
  /** Validation manifest command id */
  schemaId?: string;
  notes?: string;
}

export interface RouteDefinition {
  /** Stable id for code references (routePath('clients')) */
  id: string;
  /** App path (no hash) */
  path: string;
  kind: RouteKind;
  label: string;
  domain: string;
  /** Show in primary sidebar */
  nav?: boolean;
  navOrder?: number;
  /** No Fineract auth session required */
  public?: boolean;
  /** Active Fineract server must be selected (catalog cookie) */
  requiresServer?: boolean;
  /** Fineract user session required */
  requiresAuth?: boolean;
  /** Key into packages/auth/permissions.manifest.json */
  permissionKey?: string;
  parity: RouteParity;
}
