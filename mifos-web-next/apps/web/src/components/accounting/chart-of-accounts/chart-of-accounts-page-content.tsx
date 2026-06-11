'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { List, Network, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { GlAccountsTable } from '@/components/accounting/chart-of-accounts/gl-accounts-table';
import { GlAccountTreeView } from '@/components/accounting/chart-of-accounts/gl-account-tree-view';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'tree';

export function ChartOfAccountsPageContent({ accounts }: { accounts: FineractGlAccountListItem[] }) {
  const [view, setView] = useState<ViewMode>('list');

  return (
    <ListPage
      title="Chart of accounts"
      description="Browse and maintain general ledger accounts used across the organization."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[view]}
            onValueChange={(values) => {
              const next = values[0];
              if (next === 'list' || next === 'tree') {
                setView(next);
              }
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="View mode"
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tree" aria-label="Tree view">
              <Network className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Can permission="CREATE_GLACCOUNT">
            <Link href="/accounting/chart-of-accounts/create" className={cn(buttonVariants())}>
              <Plus className="mr-2 size-4" />
              Add account
            </Link>
          </Can>
        </div>
      }
    >
      {view === 'list' ? <GlAccountsTable accounts={accounts} /> : <GlAccountTreeView accounts={accounts} />}
    </ListPage>
  );
}
