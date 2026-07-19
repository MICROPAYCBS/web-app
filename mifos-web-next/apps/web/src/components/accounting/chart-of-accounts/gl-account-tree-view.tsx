'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  DetailField,
  DetailFieldGrid
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatGlAccountTypeLabel } from '@/lib/accounting/gl-account-display';
import { buildGlAccountTree, type GlAccountTreeNode } from '@/lib/accounting/gl-account-tree';
import type { FineractGlAccountListItem } from '@mifos/api-client';
import { yesNoLabel } from '@/lib/fineract/user-display';
import { cn } from '@/lib/utils';

function collectExpandableKeys(nodes: GlAccountTreeNode[], prefix = ''): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    const key = `${prefix}/${node.name}`;
    if (node.children.length > 0) {
      keys.push(key);
      keys.push(...collectExpandableKeys(node.children, key));
    }
  }
  return keys;
}

function TreeNodeRow({
  node,
  depth,
  path,
  expanded,
  onToggle,
  selectedId,
  onSelect
}: {
  node: GlAccountTreeNode;
  depth: number;
  path: string;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  selectedId?: number;
  onSelect: (node: GlAccountTreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(path);
  const isSelected = node.id != null && node.id === selectedId;
  const isAccount = node.id != null;

  return (
    <li>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md py-1 pr-2 text-sm',
          isSelected ? 'bg-muted' : 'hover:bg-muted/60'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => onToggle(path)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        ) : (
          <span className="inline-block size-7 shrink-0" aria-hidden />
        )}
        {isAccount ? (
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left"
            onClick={() => onSelect(node)}
          >
            {node.glCode ? <span className="text-muted-foreground">({node.glCode}) </span> : null}
            {node.name}
          </button>
        ) : (
          <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
        )}
      </div>
      {hasChildren && isExpanded ? (
        <ul>
          {node.children.map((child) => (
            <TreeNodeRow
              key={`${path}/${child.id ?? child.name}`}
              node={child}
              depth={depth + 1}
              path={`${path}/${child.id ?? child.name}`}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function GlAccountTreeView({ accounts }: { accounts: FineractGlAccountListItem[] }) {
  const tree = useMemo(() => buildGlAccountTree(accounts), [accounts]);
  const expandableKeys = useMemo(() => collectExpandableKeys(tree), [tree]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(expandableKeys));
  const [selected, setSelected] = useState<GlAccountTreeNode | null>(null);
  const allExpanded = expandableKeys.length > 0 && expandableKeys.every((key) => expanded.has(key));

  function toggleKey(key: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(expandableKeys));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Account tree</h3>
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </Button>
        </div>
        <ul>
          {tree.map((node) => (
            <TreeNodeRow
              key={node.name}
              node={node}
              depth={0}
              path={`/${node.name}`}
              expanded={expanded}
              onToggle={toggleKey}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          ))}
        </ul>
      </div>

      {selected?.id ? (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium">{selected.name}</h3>
              <p className="text-sm text-muted-foreground">{selected.glCode}</p>
            </div>
            <Link
              href={`/accounting/chart-of-accounts/${selected.id}`}
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
            >
              Open
            </Link>
          </div>
          <DetailFieldGrid columns={1}>
            <DetailField label="Account type">
              {formatGlAccountTypeLabel(
                selected.type ? { id: 0, value: selected.type } : undefined
              )}
            </DetailField>
            <DetailField label="Usage">{selected.usage ?? '—'}</DetailField>
            <DetailField label="Manual entries allowed">
              {yesNoLabel(selected.manualEntriesAllowed === true)}
            </DetailField>
            <DetailField label="Description">{selected.description || '—'}</DetailField>
          </DetailFieldGrid>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Select an account in the tree to preview details.
        </div>
      )}
    </div>
  );
}
