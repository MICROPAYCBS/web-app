'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob, FineractSchedulerStatus } from '@mifos/api-client';
import { Play, RefreshCw, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CustomParametersDialog } from '@/components/system/manage-jobs/custom-parameters-dialog';
import { RunJobsDialog } from '@/components/system/manage-jobs/run-jobs-dialog';
import { SchedulerJobsTable } from '@/components/system/manage-jobs/scheduler-jobs-table';
import { SchedulerStatusBanner } from '@/components/system/manage-jobs/scheduler-status-banner';
import { Button } from '@/components/ui/button';

export function SchedulerJobsPanel({
  jobs,
  scheduler,
  canUpdate,
  canExecute
}: {
  jobs: FineractSchedulerJob[];
  scheduler: FineractSchedulerStatus;
  canUpdate: boolean;
  canExecute: boolean;
}) {
  const router = useRouter();
  const [selectedJobs, setSelectedJobs] = useState<FineractSchedulerJob[]>([]);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const hasSelection = selectedJobs.length > 0;

  return (
    <div className="space-y-6">
      <SchedulerStatusBanner scheduler={scheduler} canUpdate={canUpdate} />
      {canExecute ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!hasSelection} onClick={() => setRunDialogOpen(true)}>
            <Play className="mr-2 size-4" />
            Run selected jobs
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasSelection}
            onClick={() => setCustomDialogOpen(true)}
          >
            <Settings2 className="mr-2 size-4" />
            Add custom parameters
          </Button>
          <Button type="button" variant="outline" onClick={() => router.refresh()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => router.refresh()}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      )}
      <SchedulerJobsTable jobs={jobs} canExecute={canExecute} onSelectionChange={setSelectedJobs} />
      <RunJobsDialog open={runDialogOpen} onOpenChange={setRunDialogOpen} jobs={selectedJobs} />
      <CustomParametersDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        jobs={selectedJobs}
      />
    </div>
  );
}
