/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountListItem } from '@mifos/api-client';
import { formatGlAccountTypeLabel } from '@/lib/accounting/gl-account-display';

export interface GlAccountTreeNode {
  id?: number;
  name: string;
  glCode?: string;
  type?: string;
  usage?: string;
  manualEntriesAllowed?: boolean;
  description?: string;
  children: GlAccountTreeNode[];
}

const TYPE_SECTIONS = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
  { value: 'LIABILITY', label: 'Liability' }
] as const;

function accountNode(account: FineractGlAccountListItem): GlAccountTreeNode {
  return {
    id: account.id,
    name: account.name,
    glCode: account.glCode,
    type: account.type.value,
    usage: account.usage.value,
    manualEntriesAllowed: account.manualEntriesAllowed,
    description: account.description,
    children: []
  };
}

export function buildGlAccountTree(accounts: FineractGlAccountListItem[]): GlAccountTreeNode[] {
  const root: GlAccountTreeNode = {
    name: 'Accounts',
    children: TYPE_SECTIONS.map((section) => ({
      name: section.label,
      children: []
    }))
  };

  if (accounts.length === 0) {
    return [root];
  }

  const sorted = [...accounts].sort((left, right) => {
    const leftParent = left.parentId ?? 0;
    const rightParent = right.parentId ?? 0;
    return leftParent - rightParent;
  });

  const nodes = new Map<number, GlAccountTreeNode>();
  for (const account of sorted) {
    nodes.set(account.id, accountNode(account));
  }

  const sectionIndex = (typeValue: string) =>
    TYPE_SECTIONS.findIndex((section) => section.value === typeValue);

  for (const account of sorted) {
    const node = nodes.get(account.id);
    if (!node) {
      continue;
    }

    const parentId = account.parentId ?? 0;
    if (parentId === 0) {
      const index = sectionIndex(account.type.value ?? '');
      if (index >= 0) {
        root.children[index]?.children.push(node);
      }
      continue;
    }

    const parent = nodes.get(parentId);
    if (parent) {
      parent.children.push(node);
    }
  }

  return [root];
}

export function formatTreeNodeMeta(node: GlAccountTreeNode) {
  if (!node.type) {
    return node.name;
  }
  return `${formatGlAccountTypeLabel({ id: 0, value: node.type })} · ${node.usage ?? '—'}`;
}
