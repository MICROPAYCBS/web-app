'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerStatus } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { runSchedulerCommandAction } from '@/actions/jobs';
import { Button } from '@/components/ui/button';

export function SchedulerStatusBanner({
  scheduler,
  canUpdate
}: {
  scheduler: FineractSchedulerStatus;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCommand(command: 'start' | 'stop') {
    startTransition(async () => {
      const result = await runSchedulerCommandAction(command);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(command === 'start' ? 'Scheduler activated.' : 'Scheduler suspended.');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">Scheduler status</p>
        <p className="text-sm text-muted-foreground">
          {scheduler.active ? 'Active — jobs run on schedule.' : 'Inactive — scheduled jobs are suspended.'}
        </p>
      </div>
      {canUpdate ? (
        <div className="flex gap-2">
          {scheduler.active ? (
            <Button type="button" variant="outline" disabled={pending} onClick={() => handleCommand('stop')}>
              Suspend scheduler
            </Button>
          ) : (
            <Button type="button" disabled={pending} onClick={() => handleCommand('start')}>
              Activate scheduler
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
