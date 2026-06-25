'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  ArrowLeftRight,
  Banknote,
  Briefcase,
  ChartPie,
  ChevronLeft,
  FileText,
  Fingerprint,
  MapPin,
  NotebookPen,
  Phone,
  PiggyBank,
  Repeat,
  Shield,
  Table2,
  UserRound,
  Users,
  Vault
} from 'lucide-react';
import {
  clientCollateralListPath,
  clientStandingInstructionsListPath
} from '@/lib/fineract/client-secondary-list-paths';
import Link from 'next/link';
import type { ClientDatatableNavItem } from '@/lib/fineract/client-datatable-nav';
import {
  DetailNavSidebar,
  type DetailNavGroup
} from '@/components/composites/detail/detail-nav-sidebar';

export function clientDetailNavGroups(
  clientId: string | number,
  datatableNavItems: ClientDatatableNavItem[] = []
): DetailNavGroup[] {
  const base = `/clients/${clientId}`;
  const datatableItems = datatableNavItems.map((item) => ({ ...item, icon: Table2 }));
  const groups: DetailNavGroup[] = [
    {
      id: 'general',
      items: [{ id: 'general', label: 'General', href: `${base}/general`, icon: UserRound }]
    },
    {
      id: 'accounts',
      items: [
        { id: 'loans', label: 'Loans', href: `${base}/loans`, icon: Banknote },
        { id: 'savings', label: 'Savings', href: `${base}/savings`, icon: PiggyBank },
        {
          id: 'fixed-deposits',
          label: 'Fixed deposits',
          href: `${base}/fixed-deposits`,
          icon: Vault
        },
        {
          id: 'recurring-deposits',
          label: 'Recurring deposits',
          href: `${base}/recurring-deposits`,
          icon: Repeat
        },
        { id: 'shares', label: 'Shares', href: `${base}/shares`, icon: ChartPie }
      ]
    },
    {
      id: 'lists',
      items: [
        {
          id: 'address',
          label: 'Customer addresses',
          href: `${base}/address`,
          icon: MapPin
        },
        {
          id: 'contacts',
          label: 'Customer contacts',
          href: `${base}/contacts`,
          icon: Phone
        },
        {
          id: 'family-members',
          label: 'Next of kin',
          href: `${base}/family-members`,
          icon: Users
        },
        {
          id: 'income-sources',
          label: 'Income sources',
          href: `${base}/income-sources`,
          icon: Briefcase
        },
        {
          id: 'compliance-profile',
          label: 'Compliance',
          href: `${base}/compliance-profile`,
          icon: Shield
        },
        {
          id: 'identities',
          label: 'Identities',
          href: `${base}/identities`,
          icon: Fingerprint
        },
        {
          id: 'documents',
          label: 'Documents',
          href: `${base}/documents`,
          icon: FileText
        },
        {
          id: 'notes',
          label: 'Notes',
          href: `${base}/notes`,
          icon: NotebookPen
        },
        {
          id: 'collateral',
          label: 'Collateral',
          href: clientCollateralListPath(clientId),
          icon: Shield
        },
        {
          id: 'standing-instructions',
          label: 'Standing instructions',
          href: clientStandingInstructionsListPath(clientId),
          icon: ArrowLeftRight
        }
      ]
    },
    ...(datatableItems.length > 0
      ? [{ id: 'datatables', items: datatableItems }]
      : [])
  ];
  return groups;
}

export function ClientDetailNav({
  clientId,
  datatableNavItems = []
}: {
  clientId: string | number;
  datatableNavItems?: ClientDatatableNavItem[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4 shrink-0" aria-hidden />
        Back to customers
      </Link>
      <DetailNavSidebar groups={clientDetailNavGroups(clientId, datatableNavItems)} />
    </div>
  );
}
