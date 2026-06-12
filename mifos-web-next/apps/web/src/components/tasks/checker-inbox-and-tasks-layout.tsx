'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailNavTabs } from '@/components/composites/detail/detail-nav-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHECKER_INBOX_LIST_PATH } from '@/lib/fineract/checker-inbox-paths';

const TABS = [
  {
    id: 'checker-inbox',
    label: 'Checker inbox',
    href: CHECKER_INBOX_LIST_PATH
  }
] as const;

export function CheckerInboxAndTasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg">Pending tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <DetailNavTabs tabs={[...TABS]} />
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
