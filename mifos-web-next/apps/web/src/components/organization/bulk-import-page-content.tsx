'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import Link from 'next/link';
import type { BulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { bulkImportDetailPath } from '@/lib/fineract/bulk-import-paths';
import { ListPage } from '@/components/composites/list-page';

function BulkImportOption({ option }: { option: BulkImportDefinition }) {
  return (
    <Can permission={option.listPermission}>
      <Link
        href={bulkImportDetailPath(option.name)}
        className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
      >
        <div className="font-medium text-primary">{option.name}</div>
        <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
      </Link>
    </Can>
  );
}

export function BulkImportPageContent({ options }: { options: BulkImportDefinition[] }) {
  const midpoint = Math.ceil(options.length / 2);
  const left = options.slice(0, midpoint);
  const right = options.slice(midpoint);

  return (
    <ListPage
      title="Bulk import"
      description="Download Excel templates and upload data for organization entities."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          {left.map((option) => (
            <BulkImportOption key={option.name} option={option} />
          ))}
        </div>
        <div className="space-y-3">
          {right.map((option) => (
            <BulkImportOption key={option.name} option={option} />
          ))}
        </div>
      </div>
    </ListPage>
  );
}
