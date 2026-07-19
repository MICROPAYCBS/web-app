'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountingRuleListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { AccountingRulesTable } from '@/components/accounting/accounting-rules/accounting-rules-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AccountingRulesPageContent({ rules }: { rules: FineractAccountingRuleListItem[] }) {
  return (
    <ListPage
      title="Accounting rules"
      description="Define debit and credit GL entry rules by branch, account, or tag."
      actions={
        <Can permission="CREATE_ACCOUNTINGRULE">
          <Link href="/accounting/accounting-rules/create" className={cn(buttonVariants())}>
            <Plus className="mr-2 size-4" />
            Create rule
          </Link>
        </Can>
      }
    >
      <AccountingRulesTable rules={rules} />
    </ListPage>
  );
}
