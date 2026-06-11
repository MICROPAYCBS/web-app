import { APP_ROUTES } from './app-routes';
import { NAV_GROUPS } from './nav-groups';
import type { NavGroupId, RouteDefinition } from './types';

export type NavLinkStatus = 'live' | 'soon';

export interface NavLinkItem {
  id: string;
  routeId: string;
  href: string;
  label: string;
  icon?: string;
  permissionKey?: string;
  status: NavLinkStatus;
  keywords: string[];
  groupId?: NavGroupId;
  featured?: boolean;
}

export interface NavGroupSection {
  id: NavGroupId;
  label: string;
  icon: string;
  defaultOpen: boolean;
  items: NavLinkItem[];
}

export interface NavStructure {
  featured: NavLinkItem[];
  groups: NavGroupSection[];
  quickFind: NavLinkItem[];
}

function routeStatus(route: RouteDefinition): NavLinkStatus {
  if (route.parity.status === 'done' || route.parity.status === 'in_progress') {
    return 'live';
  }
  return 'soon';
}

function toNavLink(route: RouteDefinition): NavLinkItem {
  return {
    id: route.id,
    routeId: route.id,
    href: route.path,
    label: route.label,
    icon: route.navIcon,
    permissionKey: route.permissionKey,
    status: routeStatus(route),
    keywords: route.keywords ?? [],
    groupId: route.navGroup,
    featured: route.navFeatured === true
  };
}

function isQuickFindRoute(route: RouteDefinition): boolean {
  if (route.quickFind === false) {
    return false;
  }
  if (route.kind !== 'page') {
    return false;
  }
  if (route.public === true && route.requiresAuth === false) {
    return false;
  }
  return true;
}

function sortByOrder<T extends { navOrder?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.navOrder ?? 0) - (b.navOrder ?? 0));
}

function sortFeatured(a: RouteDefinition, b: RouteDefinition): number {
  return (a.navFeaturedOrder ?? 0) - (b.navFeaturedOrder ?? 0);
}

/** Vercel-style nav: featured shortcuts + collapsible groups + Quick Find index. */
export function buildNavStructure(): NavStructure {
  const routes = Object.values(APP_ROUTES) as RouteDefinition[];

  const featured = routes
    .filter((r) => r.navFeatured === true && r.kind === 'page')
    .sort(sortFeatured)
    .map(toNavLink);

  const groups: NavGroupSection[] = NAV_GROUPS.map((group) => {
    const items = sortByOrder(
      routes.filter((r) => r.nav === true && r.navGroup === group.id && r.kind === 'page')
    ).map(toNavLink);
    return {
      id: group.id,
      label: group.label,
      icon: group.icon,
      defaultOpen: group.defaultOpen ?? false,
      items
    };
  }).filter((g) => g.items.length > 0);

  const quickFind = routes
    .filter(isQuickFindRoute)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(toNavLink);

  return { featured, groups, quickFind };
}

/** Searchable text for Quick Find filtering. */
export function navLinkSearchText(item: NavLinkItem): string {
  return [item.label, item.href, ...item.keywords].join(' ').toLowerCase();
}
