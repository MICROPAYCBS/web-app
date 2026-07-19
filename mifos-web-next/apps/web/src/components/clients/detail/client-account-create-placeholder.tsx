/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { ComingSoonPage } from '@/components/platform/coming-soon-page';
import { clientAccountListPath, type ClientAccountProductKind } from '@/lib/fineract/client-account-links';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COPY: Record<
  ClientAccountProductKind,
  { title: string; backLabel: string }
> = {
  loan: { title: 'New loan account', backLabel: 'Back to loans' },
  savings: { title: 'New savings account', backLabel: 'Back to savings' },
  share: { title: 'New share account', backLabel: 'Back to shares' },
  fixedDeposit: { title: 'New fixed deposit account', backLabel: 'Back to fixed deposits' },
  recurringDeposit: {
    title: 'New recurring deposit account',
    backLabel: 'Back to recurring deposits'
  }
};

export function ClientAccountCreatePlaceholder({
  clientId,
  kind
}: {
  clientId: string;
  kind: ClientAccountProductKind;
}) {
  const copy = COPY[kind];

  return (
    <div className="space-y-4">
      <Link
        href={clientAccountListPath(clientId, kind)}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
      >
        {copy.backLabel}
      </Link>
      <ComingSoonPage
        title={copy.title}
        description="Account application workflows are registered in navigation and will be implemented in a future iteration."
      />
    </div>
  );
}
