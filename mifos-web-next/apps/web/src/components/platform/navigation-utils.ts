/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  PlatformNavGroup,
  PlatformNavLink,
  PlatformNavStructure
} from './navigation-types';

export function navLinkSearchText(item: PlatformNavLink): string {
  return [item.label, item.href, ...item.keywords].join(' ').toLowerCase();
}

export function matchesNavFindQuery(item: PlatformNavLink, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return navLinkSearchText(item).includes(q);
}

export function isNavPathActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavGroupForPath(
  nav: PlatformNavStructure,
  pathname: string
): PlatformNavGroup | null {
  for (const group of nav.groups) {
    if (group.items.some((item) => isNavPathActive(pathname, item.href))) {
      return group;
    }
  }
  return null;
}

export function filterNavLinks(items: PlatformNavLink[], query: string): PlatformNavLink[] {
  return items.filter((item) => matchesNavFindQuery(item, query));
}

export function filterNavGroups(
  groups: PlatformNavGroup[],
  query: string
): PlatformNavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return groups;
  }
  return groups.filter(
    (group) =>
      group.label.toLowerCase().includes(q) ||
      group.items.some((item) => matchesNavFindQuery(item, query))
  );
}

/** Flat list of links matching find query (for root-level search results). */
export function flattenMatchingNavLinks(
  nav: PlatformNavStructure,
  query: string
): PlatformNavLink[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const seen = new Set<string>();
  const results: PlatformNavLink[] = [];
  const add = (item: PlatformNavLink) => {
    if (seen.has(item.id)) {
      return;
    }
    if (matchesNavFindQuery(item, q)) {
      seen.add(item.id);
      results.push(item);
    }
  };
  nav.featured.forEach(add);
  nav.groups.forEach((group) => group.items.forEach(add));
  return results.sort((a, b) => a.label.localeCompare(b.label));
}
