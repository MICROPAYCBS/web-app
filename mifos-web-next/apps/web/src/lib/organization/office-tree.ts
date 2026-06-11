/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem } from '@mifos/api-client';

export interface OfficeTreeNode {
  id: number;
  name: string;
  nameDecorated?: string;
  parentId?: number;
  hierarchy?: string;
  externalId?: string;
  parentName?: string;
  openingDate?: number[] | string;
  children: OfficeTreeNode[];
}

/** Build a hierarchical branch tree from a flat office list (legacy web-app parity). */
export function buildOfficeTree(offices: FineractOfficeListItem[]): OfficeTreeNode[] {
  if (offices.length === 0) {
    return [];
  }

  const mainOffice = offices.find((office) => office.hierarchy === '.');
  if (!mainOffice) {
    return offices.map((office) => ({ ...office, children: [] }));
  }

  const officeTree: OfficeTreeNode[] = [
    {
      id: mainOffice.id,
      name: mainOffice.name,
      nameDecorated: mainOffice.nameDecorated,
      parentId: mainOffice.parentId,
      hierarchy: mainOffice.hierarchy,
      externalId: mainOffice.externalId,
      parentName: mainOffice.parentName,
      openingDate: mainOffice.openingDate,
      children: []
    }
  ];

  const sorted = [...offices].sort((a, b) => {
    const parentA = a.parentId ?? 0;
    const parentB = b.parentId ?? 0;
    return parentA - parentB;
  });

  const nodes: OfficeTreeNode[] = [];
  for (const office of sorted) {
    nodes[office.id] = {
      id: office.id,
      name: office.name,
      nameDecorated: office.nameDecorated,
      parentId: office.parentId,
      hierarchy: office.hierarchy,
      externalId: office.externalId,
      parentName: office.parentName,
      openingDate: office.openingDate,
      children: []
    };
  }

  for (const office of sorted) {
    if (office.hierarchy === '.') {
      continue;
    }
    const node = nodes[office.id];
    if (!node) {
      continue;
    }
    if (office.parentId === 1) {
      officeTree[0].children.push(node);
    } else if (office.parentId != null && nodes[office.parentId]) {
      nodes[office.parentId].children.push(node);
    }
  }

  return officeTree;
}

export function collectOfficeTreeKeys(nodes: OfficeTreeNode[], prefix = ''): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    const key = `${prefix}/${node.id}`;
    if (node.children.length > 0) {
      keys.push(key);
      keys.push(...collectOfficeTreeKeys(node.children, key));
    }
  }
  return keys;
}
