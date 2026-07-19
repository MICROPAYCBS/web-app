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
  PlatformNavSearchResult,
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

const QUICK_ACCESS_SECTION = 'Quick access';
const ALL_PAGES_SECTION = 'All pages';

/** Global Find results across featured links, nav groups, and the full Quick Find index. */
export function searchNavLinks(
  nav: PlatformNavStructure,
  query: string
): PlatformNavSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();
  const results: PlatformNavSearchResult[] = [];
  const add = (link: PlatformNavLink, sectionLabel: string) => {
    if (seenIds.has(link.id) || seenHrefs.has(link.href)) {
      return;
    }
    if (matchesNavFindQuery(link, q)) {
      seenIds.add(link.id);
      seenHrefs.add(link.href);
      results.push({ link, sectionLabel });
    }
  };
  nav.featured.forEach((item) => add(item, QUICK_ACCESS_SECTION));
  nav.groups.forEach((group) =>
    group.items.forEach((item) => add(item, group.label))
  );
  nav.quickFind.forEach((item) => add(item, ALL_PAGES_SECTION));
  return results.sort((a, b) => {
    const byLabel = a.link.label.localeCompare(b.link.label);
    if (byLabel !== 0) {
      return byLabel;
    }
    return a.sectionLabel.localeCompare(b.sectionLabel);
  });
}

/** Flat list of links matching find query (legacy helper). */
export function flattenMatchingNavLinks(
  nav: PlatformNavStructure,
  query: string
): PlatformNavLink[] {
  return searchNavLinks(nav, query).map((result) => result.link);
}
