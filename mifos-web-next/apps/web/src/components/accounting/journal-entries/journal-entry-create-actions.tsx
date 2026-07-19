'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import { Layers } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  JOURNAL_ENTRIES_BULK_OPERATIONS_LABEL,
  JOURNAL_ENTRIES_BULK_OPERATIONS_PATH
} from '@/lib/fineract/bulk-import-paths';
import { cn } from '@/lib/utils';

export function JournalEntryCreateActions() {
  return (
    <Can permission="READ_JOURNALENTRY">
      <Link
        href={JOURNAL_ENTRIES_BULK_OPERATIONS_PATH}
        className={cn(buttonVariants({ variant: 'outline' }))}
      >
        <Layers className="mr-2 size-4" />
        {JOURNAL_ENTRIES_BULK_OPERATIONS_LABEL}
      </Link>
    </Can>
  );
}
