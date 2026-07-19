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
    href: '/organization/offices',
    title: 'Branches',
    description: 'Branch hierarchy, profiles, and opening dates.'
  },
  {
    href: '/organization/employees',
    title: 'Employees',
    description: 'Staff and relationship officers by branch.'
  },
  {
    href: '/organization/provisioning-criteria',
    title: 'Provisioning criteria',
    description: 'Loan loss provisioning rules by product category.'
  },
  {
    href: '/organization/currencies',
    title: 'Currencies',
    description: 'Organization currency configuration.'
  },
  {
    href: '/organization/payment-types',
    title: 'Payment types',
    description: 'Payment classification for transactions.'
  },
  {
    href: '/organization/holidays',
    title: 'Holidays',
    description: 'Non-working days and repayment rescheduling.'
  },
  {
    href: '/organization/working-days',
    title: 'Working days',
    description: 'Weekly working-day pattern and meeting frequency.'
  },
  {
    href: '/organization/manage-funds',
    title: 'Manage funds',
    description: 'Named funds for loan portfolio grouping.'
  },
  {
    href: '/organization/bulk-import',
    title: 'Bulk import',
    description: 'Excel templates for mass data loads.'
  },
  {
    href: '/organization/bulkloan',
    title: 'Bulk loan reassignment',
    description: 'Move loans between loan officers in a branch.'
  },
  {
    href: '/organization/sms-campaigns',
    title: 'SMS campaigns',
    description: 'Outbound SMS campaign configuration.'
  },
  {
    href: '/organization/tellers',
    title: 'Tellers',
    description: 'Branch tellers and cashier cash management.'
  },
  {
    href: '/organization/customer-classes',
    title: 'Customer classes',
    description: 'Customer segmentation and KYC defaults.'
  },
  {
    href: '/organization/customer-titles',
    title: 'Customer titles',
    description: 'Salutation titles on customer biodata.'
  },
  {
    href: '/organization/contact-types',
    title: 'Contact types',
    description: 'Customer contact channel definitions.'
  },
  {
    href: '/organization/identity-types',
    title: 'Identity type guides',
    description: 'Document validation rules for identifiers.'
  },
  {
    href: '/organization/sectors',
    title: 'Sectors',
    description: 'Economic sector hierarchy.'
  },
  {
    href: '/organization/industries',
    title: 'Industries',
    description: 'Industry codes within sectors.'
  },
  {
    href: '/organization/entity-data-table-checks',
    title: 'Entity data table checks',
    description: 'Required custom fields per entity type.'
  },
  {
    href: '/organization/manage-loan-originators',
    title: 'Loan originators',
    description: 'Third-party loan originator registry.'
  }
] as const;

export function OrganizationHubContent() {
  return (
    <ListPage
      title="Organization"
      description="Branches, staff, holidays, and reference data for day-to-day operations."
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
