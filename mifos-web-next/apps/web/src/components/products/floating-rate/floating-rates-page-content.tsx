'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FloatingRateListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { FloatingRatesTable } from '@/components/products/floating-rate/floating-rates-table';
import { buttonVariants } from '@/components/ui/button';
import { floatingRateCreatePath } from '@/lib/fineract/floating-rate-paths';
import { cn } from '@/lib/utils';

export function FloatingRatesPageContent({ rates }: { rates: FloatingRateListItem[] }) {
  return (
    <ListPage
      title="Floating rates"
      description="Interest rate schemes with effective-dated periods for variable loan products."
      actions={
        <Can permission="CREATE_FLOATINGRATE">
          <Link href={floatingRateCreatePath()} className={cn(buttonVariants())}>
            Create floating rate
          </Link>
        </Can>
      }
    >
      <FloatingRatesTable rates={rates} />
    </ListPage>
  );
}
