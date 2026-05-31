/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailNavSidebar, type DetailNavGroup } from '@/components/composites/detail/detail-nav-sidebar';

export function clientDetailNavGroups(clientId: string | number): DetailNavGroup[] {
  const base = `/clients/${clientId}`;
  return [
    {
      id: 'client',
      label: 'Client',
      items: [{ id: 'general', label: 'General', href: `${base}/general` }]
    },
    {
      id: 'accounts',
      label: 'Accounts & services',
      items: [
        { id: 'loans', label: 'Loans', href: `${base}/loans` },
        { id: 'savings', label: 'Savings', href: `${base}/savings` },
        { id: 'fixed-deposits', label: 'Fixed deposits', href: `${base}/fixed-deposits` }
      ]
    },
    {
      id: 'relations',
      label: 'Relations',
      items: [{ id: 'relations', label: 'Many to one', href: `${base}/relations` }]
    }
  ];
}

export function ClientDetailNav({ clientId }: { clientId: string | number }) {
  return <DetailNavSidebar title="Client" groups={clientDetailNavGroups(clientId)} />;
}
