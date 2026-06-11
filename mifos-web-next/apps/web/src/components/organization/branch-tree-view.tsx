'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem } from '@mifos/api-client';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DetailField, DetailFieldGrid } from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import { branchDisplayName } from '@/lib/fineract/office-display';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import {
  buildOfficeTree,
  collectOfficeTreeKeys,
  type OfficeTreeNode
} from '@/lib/organization/office-tree';
import { cn } from '@/lib/utils';

function TreeNodeRow({
  node,
  depth,
  path,
  expanded,
  onToggle,
  selectedId,
  onSelect
}: {
  node: OfficeTreeNode;
  depth: number;
  path: string;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  selectedId?: number;
  onSelect: (node: OfficeTreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(path);
  const isSelected = node.id === selectedId;

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
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left"
          onClick={() => onSelect(node)}
        >
          {branchDisplayName(node)}
        </button>
      </div>
      {hasChildren && isExpanded ? (
        <ul>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              path={`${path}/${child.id}`}
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

export function BranchTreeView({ offices }: { offices: FineractOfficeListItem[] }) {
  const tree = useMemo(() => buildOfficeTree(offices), [offices]);
  const expandableKeys = useMemo(() => collectOfficeTreeKeys(tree), [tree]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(expandableKeys));
  const [selected, setSelected] = useState<OfficeTreeNode | null>(null);
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
          <h3 className="text-sm font-medium">Branch tree</h3>
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </Button>
        </div>
        <ul>
          {tree.map((node) => (
            <TreeNodeRow
              key={node.id}
              node={node}
              depth={0}
              path={`/${node.id}`}
              expanded={expanded}
              onToggle={toggleKey}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          ))}
        </ul>
      </div>

      {selected ? (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium">{branchDisplayName(selected)}</h3>
              {selected.externalId ? (
                <p className="text-sm text-muted-foreground">{selected.externalId}</p>
              ) : null}
            </div>
            <Link
              href={`/organization/offices/${selected.id}`}
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
            >
              Open
            </Link>
          </div>
          <DetailFieldGrid columns={1}>
            <DetailField label="Parent branch">{selected.parentName ?? '—'}</DetailField>
            <DetailField label="Opening date">
              {formatFineractDateArray(selected.openingDate) ?? '—'}
            </DetailField>
            <DetailField label="External ID">{selected.externalId?.trim() || '—'}</DetailField>
          </DetailFieldGrid>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Select a branch in the tree to preview details.
        </div>
      )}
    </div>
  );
}
