'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractHookListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { HooksTable } from '@/components/system/hooks-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HooksPageContent({ hooks }: { hooks: FineractHookListItem[] }) {
  return (
    <ListPage
      title="Hooks"
      description="Trigger custom actions when platform events occur, such as web callbacks or SMS notifications."
      actions={
        <Can permission="CREATE_HOOK">
          <Link href="/system/hooks/create" className={cn(buttonVariants())}>
            Create hook
          </Link>
        </Can>
      }
    >
      <HooksTable hooks={hooks} />
    </ListPage>
  );
}
