/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CenterDetail } from '@mifos/api-client';
import type { ReactNode } from 'react';
import { CenterDetailTop } from '@/components/centers/center-detail-top';
import { DetailNavTabs } from '@/components/composites/detail/detail-nav-tabs';
import { DetailPage } from '@/components/composites';
import { centerGeneralPath } from '@/lib/fineract/center-paths';

export function CenterDetailShell({
  center,
  canEdit,
  children
}: {
  center: CenterDetail;
  canEdit: boolean;
  children: ReactNode;
}) {
  const tabs = [
    {
      id: 'general',
      label: 'General',
      href: centerGeneralPath(center.id)
    }
  ];

  return (
    <DetailPage
      header={<CenterDetailTop center={center} canEdit={canEdit} />}
    >
      <DetailNavTabs tabs={tabs} />
      {children}
    </DetailPage>
  );
}
