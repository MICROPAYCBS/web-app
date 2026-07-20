/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPage } from '@/components/composites/list-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function GlAccountEnquiryLoading() {
  return (
    <ListPage
      title="GL account enquiry"
      description="Search GL accounts by prefix, ledger number, description, branch, department, currency, status, or zero balance."
    >
      <div className="space-y-4" aria-busy aria-label="Loading GL account enquiry">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-9 w-28" />
      </div>
    </ListPage>
  );
}
