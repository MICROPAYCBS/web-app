'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCode } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { SystemCodesTable } from '@/components/system/system-codes-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SystemCodesPageContent({ codes }: { codes: FineractCode[] }) {
  return (
    <ListPage
      title="Codes"
      description="Lookup lists used for dropdowns and classifications across the application."
      actions={
        <Can permission="CREATE_CODE">
          <Link href="/system/codes?create=1" className={cn(buttonVariants())}>
            Create code
          </Link>
        </Can>
      }
    >
      <SystemCodesTable codes={codes} />
    </ListPage>
  );
}
