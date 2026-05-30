/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Authentication will connect to Fineract basic auth and OAuth/OIDC.
          </p>
        </div>
        <Button className="w-full" disabled>
          Continue (coming soon)
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: 'ghost' }), 'w-full')}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
