'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LoadErrorAlert({
  message,
  title = 'Could not load data',
  hint
}: {
  message: string;
  title?: string;
  hint?: string;
}) {
  const router = useRouter();

  return (
    <div
      className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">{title}</p>
          <p className="text-sm text-destructive/90">{message}</p>
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
          <Button type="button" variant="outline" size="sm" onClick={() => router.refresh()}>
            <RotateCcw className="mr-2 size-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
