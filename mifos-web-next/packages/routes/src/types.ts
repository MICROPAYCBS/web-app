export type RouteKind = 'page' | 'api' | 'layout';

export type ParityStatus = 'todo' | 'in_progress' | 'done' | 'n/a';

export type NavIcon =
  | 'layout-dashboard'
  | 'users'
  | 'user'
  | 'users-round'
  | 'building-2'
  | 'landmark'
  | 'piggy-bank'
  | 'wallet'
  | 'book-open'
  | 'calculator'
  | 'building'
  | 'settings'
  | 'inbox'
  | 'search'
  | 'file-bar-chart'
  | 'package'
  | 'shield'
  | 'database'
  | 'cog'
  | 'list';

/** Sidebar / Quick Find grouping */
export type NavGroupId =
  | 'overview'
  | 'portfolio'
  | 'products'
  | 'accounting'
  | 'organization'
  | 'system'
  | 'administration';

export interface RouteParity {
  status: ParityStatus;
  webAppRef?: string;
  fineractApi?: string;
  schemaId?: string;
  notes?: string;
}

export interface RouteDefinition {
  id: string;
  path: string;
  kind: RouteKind;
  label: string;
  domain: string;
  nav?: boolean;
  navOrder?: number;
  /** Pinned shortcuts row (Clients, Loans, Savings, …) */
  navFeatured?: boolean;
  navFeaturedOrder?: number;
  /** Collapsible sidebar section */
  navGroup?: NavGroupId;
  /** Lucide icon name */
  navIcon?: NavIcon;
  /** Include in Quick Find (default: page routes that are not public-only) */
  quickFind?: boolean;
  /** Extra search terms for Quick Find */
  keywords?: string[];
  public?: boolean;
  requiresServer?: boolean;
  requiresAuth?: boolean;
  permissionKey?: string;
  parity: RouteParity;
}
