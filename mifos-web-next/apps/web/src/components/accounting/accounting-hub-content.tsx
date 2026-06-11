'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    href: '/accounting/chart-of-accounts',
    title: 'Chart of accounts',
    description: 'Browse and maintain general ledger accounts.'
  },
  {
    href: '/accounting/journal-entries',
    title: 'Journal entries',
    description: 'Search and create journal entries.'
  },
  {
    href: '/accounting/journal-entries/frequent-postings',
    title: 'Frequent postings',
    description: 'Post recurring journal entries quickly.'
  },
  {
    href: '/accounting/financial-activity-mappings',
    title: 'Financial activity mappings',
    description: 'Map financial activities to GL accounts.'
  },
  {
    href: '/accounting/migrate-opening-balances',
    title: 'Migrate opening balances',
    description: 'Define opening balances by office.'
  },
  {
    href: '/accounting/closing-entries',
    title: 'Closing entries',
    description: 'Manage accounting period closures.'
  },
  {
    href: '/accounting/accounting-rules',
    title: 'Accounting rules',
    description: 'Configure debit and credit mapping rules.'
  },
  {
    href: '/accounting/periodic-accruals',
    title: 'Periodic accruals',
    description: 'Run loan periodic accrual postings.'
  },
  {
    href: '/accounting/provisioning-entries',
    title: 'Provisioning entries',
    description: 'Create and review provisioning journal entries.'
  }
] as const;

export function AccountingHubContent() {
  return (
    <ListPage
      title="Accounting"
      description="General ledger, journals, closures, and chart of accounts."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              'rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40'
            )}
          >
            <h2 className="font-medium">{section.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            <span className={cn(buttonVariants({ variant: 'link' }), 'mt-4 h-auto px-0')}>
              Open
            </span>
          </Link>
        ))}
      </div>
    </ListPage>
  );
}
