/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPageTableSkeleton } from '@/components/composites/list-page-table-skeleton';

export default function GlAccountEnquiryLoading() {
  return (
    <ListPageTableSkeleton
      title="GL account enquiry"
      description="Search journal activity for a single GL account with opening and closing balances."
      columnCount={6}
    />
  );
}
