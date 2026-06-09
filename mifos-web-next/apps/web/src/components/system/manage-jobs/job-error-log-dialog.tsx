'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJobRunHistory } from '@mifos/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { formatJobDateTime } from '@/lib/fineract/jobs-display';

export function JobErrorLogDialog({
  open,
  onOpenChange,
  history
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history?: FineractSchedulerJobRunHistory;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job error log</DialogTitle>
          <DialogDescription>
            {history?.jobRunStartTime
              ? `Run started ${formatJobDateTime(history.jobRunStartTime)}`
              : 'Last run details'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium">Status</p>
            <p className="text-muted-foreground">{history?.status ?? '—'}</p>
          </div>
          <div>
            <p className="font-medium">Ended</p>
            <p className="text-muted-foreground">{formatJobDateTime(history?.jobRunEndTime)}</p>
          </div>
          <div>
            <p className="font-medium">Error log</p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
              {history?.jobRunErrorLog || history?.jobRunErrorMessage || 'No error log available.'}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
