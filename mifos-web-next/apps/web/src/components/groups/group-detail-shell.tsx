/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupDetail } from '@mifos/api-client';
import type { ReactNode } from 'react';
import { GroupDetailTop } from '@/components/groups/group-detail-top';
import { DetailNavTabs } from '@/components/composites/detail/detail-nav-tabs';
import { DetailPage } from '@/components/composites';
import { groupGeneralPath } from '@/lib/fineract/group-paths';

export function GroupDetailShell({
  group,
  canEdit,
  children
}: {
  group: GroupDetail;
  canEdit: boolean;
  children: ReactNode;
}) {
  const tabs = [
    {
      id: 'general',
      label: 'General',
      href: groupGeneralPath(group.id)
    }
  ];

  return (
    <DetailPage
      className="min-h-0 flex-1"
      header={<GroupDetailTop group={group} canEdit={canEdit} />}
    >
      <DetailNavTabs tabs={tabs} />
      {children}
    </DetailPage>
  );
}
