/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Greenfield Fineract client on Next.js 16.2.6 with preset-driven shadcn theming and
          Fineract-first validation.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/clients" className={cn(buttonVariants())}>
          Clients
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }))}>
          Login
        </Link>
      </div>
    </div>
  );
}
