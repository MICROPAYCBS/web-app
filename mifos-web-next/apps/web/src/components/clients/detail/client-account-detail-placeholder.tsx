/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ClientAccountDetailPlaceholder({
  title,
  accountId,
  backHref,
  backLabel
}: {
  title: string;
  accountId: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 w-fit')}
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to {backLabel}
      </Link>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground tabular-nums">Account ID {accountId}</p>
        <p className="max-w-prose text-muted-foreground">
          Full account details, transactions, and actions will be available when this product area
          is implemented. You can return to the client account list using the link above.
        </p>
      </div>
    </div>
  );
}
