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

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-medium tabular-nums text-foreground">404</p>
      <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        This page could not be found. The record may have been removed, or the link may be out of
        date.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Back to dashboard
      </Link>
    </div>
  );
}
