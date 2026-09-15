'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WizardDraftRestoreBanner({
  hint,
  onResume,
  onDiscard
}: {
  hint?: string;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
      role="status"
    >
      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">Unfinished work from this session</p>
        {hint ? <p className="text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDiscard}>
          Discard
        </Button>
        <Button type="button" size="sm" onClick={onResume}>
          <RotateCcw className="mr-2 size-4" aria-hidden />
          Resume
        </Button>
      </div>
    </div>
  );
}
