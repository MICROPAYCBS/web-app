/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { NavGroupId } from './types';
import type { NavIcon } from './nav-icons';

export interface NavGroupDefinition {
  id: NavGroupId;
  label: string;
  /** Sidebar section icon (Lucide kebab-case name) */
  icon: NavIcon;
  /** Open by default in sidebar */
  defaultOpen?: boolean;
  order: number;
}

/** Ordered sidebar sections (Vercel-style nested nav). */
export const NAV_GROUPS: NavGroupDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'layout-dashboard',
    defaultOpen: true,
    order: 10
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: 'briefcase',
    defaultOpen: true,
    order: 20
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'package',
    defaultOpen: false,
    order: 30
  },
  {
    id: 'accounting',
    label: 'Accounting',
    icon: 'calculator',
    defaultOpen: false,
    order: 40
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: 'building',
    defaultOpen: false,
    order: 50
  },
  {
    id: 'system',
    label: 'System',
    icon: 'cog',
    defaultOpen: false,
    order: 55
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: 'shield',
    defaultOpen: false,
    order: 60
  }
];

export function getNavGroupLabel(id: NavGroupId): string {
  return NAV_GROUPS.find((g) => g.id === id)?.label ?? id;
}

export function getNavGroupIcon(id: NavGroupId): NavIcon | undefined {
  return NAV_GROUPS.find((g) => g.id === id)?.icon;
}
