import type { NavGroupId } from './types';

export interface NavGroupDefinition {
  id: NavGroupId;
  label: string;
  /** Open by default in sidebar */
  defaultOpen?: boolean;
  order: number;
}

/** Ordered sidebar sections (Vercel-style nested nav). */
export const NAV_GROUPS: NavGroupDefinition[] = [
  { id: 'overview', label: 'Overview', defaultOpen: true, order: 10 },
  { id: 'portfolio', label: 'Portfolio', defaultOpen: true, order: 20 },
  { id: 'products', label: 'Products', defaultOpen: false, order: 30 },
  { id: 'accounting', label: 'Accounting', defaultOpen: false, order: 40 },
  { id: 'organization', label: 'Organization', defaultOpen: false, order: 50 },
  { id: 'administration', label: 'Administration', defaultOpen: false, order: 60 }
];

export function getNavGroupLabel(id: NavGroupId): string {
  return NAV_GROUPS.find((g) => g.id === id)?.label ?? id;
}
