'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractJobSequence,
  FineractJobSequenceRun,
  FineractSchedulerJob
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { formatActionErrorMessage } from '@mifos/validation';
import { Play, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  deleteJobSequenceAction,
  executeJobSequenceAction
} from '@/actions/job-sequences';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  buildJobsByShortName,
  formatJobSequenceTimestamp,
  isSchedulerJobInactive,
  jobSequenceRunStatusLabel,
  jobSequenceRunStatusVariant,
  jobSequenceStepTargetLabel,
  jobSequenceStepTypeLabel,
  schedulerJobDescription
} from '@/lib/fineract/job-sequence-display';
import {
  JOB_SEQUENCES_LIST_PATH,
  jobSequenceEditPath,
  jobSequenceRunPath
} from '@/lib/fineract/job-sequence-paths';
import { cn } from '@/lib/utils';

export function JobSequenceDetailView({
  sequence,
  runs,
  jobs
}: {
  sequence: FineractJobSequence;
  runs: FineractJobSequenceRun[];
  jobs: FineractSchedulerJob[];
}) {
  const router = useRouter();
  const [executeOpen, setExecuteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const jobsByShortName = useMemo(() => buildJobsByShortName(jobs), [jobs]);
  const runningRun = runs.find((run) => run.status === 'RUNNING');
  const executeDisabled = !sequence.active || runningRun != null;

  function handleExecute() {
    setActionError(null);
    startTransition(async () => {
      const result = await executeJobSequenceAction(sequence.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        toast.error(result.message);
        return;
      }
      setExecuteOpen(false);
      toast.success('Sequence run started.');
      if (result.subResourceId != null) {
        router.push(jobSequenceRunPath(sequence.id, result.subResourceId));
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteJobSequenceAction(sequence.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        toast.error(result.message);
        return;
      }
      toast.success('Job sequence deleted.');
      router.push(JOB_SEQUENCES_LIST_PATH);
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={JOB_SEQUENCES_LIST_PATH} label="Back to job sequences" />
            }
            title={sequence.name}
            status={{
              label: sequence.active ? 'Active' : 'Inactive',
              variant: sequence.active ? 'default' : 'outline'
            }}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Can permission="UPDATE_JOBSEQUENCE">
                  <Link
                    href={jobSequenceEditPath(sequence.id)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    <Pencil className="size-4" aria-hidden />
                    Edit
                  </Link>
                </Can>
                <Can permission="EXECUTE_JOBSEQUENCE">
                  <Button
                    type="button"
                    size="sm"
                    disabled={executeDisabled || pending}
                    onClick={() => setExecuteOpen(true)}
                  >
                    <Play className="size-4" aria-hidden />
                    Execute
                  </Button>
                </Can>
                <Can permission="DELETE_JOBSEQUENCE">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending || runningRun != null}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </Button>
                </Can>
              </div>
            }
            meta={
              <div className="space-y-1 text-sm text-muted-foreground">
                {sequence.description?.trim() ? <p>{sequence.description}</p> : null}
                {runningRun ? (
                  <p>
                    Run in progress —{' '}
                    <Link
                      href={jobSequenceRunPath(sequence.id, runningRun.id)}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      open run #{runningRun.id}
                    </Link>
                  </p>
                ) : null}
                <p>
                  Related:{' '}
                  <Link
                    href="/system/manage-jobs"
                    className="underline-offset-4 hover:underline"
                  >
                    Manage jobs
                  </Link>
                  {' · '}
                  <Link
                    href="/system/business-date"
                    className="underline-offset-4 hover:underline"
                  >
                    Business date
                  </Link>
                </p>
              </div>
            }
          />
        }
      >
        <div className="space-y-6">
          {actionError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}

          <DetailSection title="Steps">
            {sequence.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No steps configured.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Stop on failure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sequence.steps.map((step) => {
                    const jobDescription =
                      step.stepType === 'SCHEDULER_JOB'
                        ? schedulerJobDescription(
                            jobsByShortName.get(step.jobShortName?.trim() ?? '')
                          )
                        : undefined;
                    return (
                    <TableRow key={`${step.stepOrder}-${step.stepType}-${step.jobShortName ?? step.operationCode}`}>
                      <TableCell className="tabular-nums">{step.stepOrder}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{jobSequenceStepTypeLabel(step.stepType)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{jobSequenceStepTargetLabel(step, jobsByShortName)}</div>
                          {jobDescription ? (
                            <p className="text-xs text-muted-foreground">{jobDescription}</p>
                          ) : null}
                          {step.stepType === 'SCHEDULER_JOB' &&
                          isSchedulerJobInactive(step.jobShortName, jobs) ? (
                            <p className="text-xs text-muted-foreground">
                              Will be skipped at run time until this job is activated in Manage
                              jobs.
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{step.enabled ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{step.stopOnFailure ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </DetailSection>

          <DetailSection title="Recent runs">
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Finished</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Link
                          href={jobSequenceRunPath(sequence.id, run.id)}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          #{run.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={jobSequenceRunStatusVariant(run.status)}>
                          {jobSequenceRunStatusLabel(run.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatJobSequenceTimestamp(run.startedAt)}</TableCell>
                      <TableCell>{formatJobSequenceTimestamp(run.finishedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DetailSection>

          <DetailSection title="Summary">
            <DetailFieldGrid>
              <DetailField label="Name">{sequence.name}</DetailField>
              <DetailField label="Active">{sequence.active ? 'Yes' : 'No'}</DetailField>
              <DetailField label="Steps">{sequence.steps.length}</DetailField>
              <DetailField label="Description">
                {sequence.description?.trim() || '—'}
              </DetailField>
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </DetailPage>

      <Dialog open={executeOpen} onOpenChange={setExecuteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute {sequence.name}?</DialogTitle>
            <DialogDescription>
              This may take a long time (Loan COB and related jobs). Only one run can be in
              progress at a time. The run continues on the server — you can monitor progress on
              the run page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExecuteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={handleExecute}>
              Start run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {sequence.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the sequence definition. Past runs are not available after
              delete if the backend removes them with the sequence.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
