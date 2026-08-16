'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJobSequenceRun, FineractSchedulerJob } from '@mifos/api-client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fetchJobSequenceRunAction } from '@/actions/job-sequences';
import {
  DetailBackLink,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Badge } from '@/components/ui/badge';
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
  jobSequenceRunStatusLabel,
  jobSequenceRunStatusVariant,
  jobSequenceStepTargetLabel,
  jobSequenceStepTypeLabel,
  schedulerJobDescription
} from '@/lib/fineract/job-sequence-display';
import { jobSequenceDetailPath } from '@/lib/fineract/job-sequence-paths';

const POLL_MS = 4000;
const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

function stepDurationLabel(
  startedAt: string | null | undefined,
  finishedAt: string | null | undefined
): string {
  if (!startedAt || !finishedAt) {
    return '—';
  }
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return '—';
  }
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem ? `${minutes}m ${rem}s` : `${minutes}m`;
}

export function JobSequenceRunDetailView({
  sequenceId,
  initialRun,
  jobs
}: {
  sequenceId: number;
  initialRun: FineractJobSequenceRun;
  jobs: FineractSchedulerJob[];
}) {
  const [run, setRun] = useState(initialRun);
  const toastedTerminal = useRef(TERMINAL.has(initialRun.status));
  const jobsByShortName = useMemo(() => buildJobsByShortName(jobs), [jobs]);

  useEffect(() => {
    setRun(initialRun);
    toastedTerminal.current = TERMINAL.has(initialRun.status);
  }, [initialRun]);

  useEffect(() => {
    if (TERMINAL.has(run.status)) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      if (document.visibilityState === 'hidden') {
        return;
      }
      const result = await fetchJobSequenceRunAction(sequenceId, run.id);
      if (cancelled || !result.ok) {
        return;
      }
      setRun(result.run);
      if (TERMINAL.has(result.run.status) && !toastedTerminal.current) {
        toastedTerminal.current = true;
        if (result.run.status === 'COMPLETED') {
          toast.success('Sequence run completed.');
        } else if (result.run.status === 'FAILED') {
          toast.error(result.run.errorMessage?.trim() || 'Sequence run failed.');
        } else {
          toast.message(`Sequence run ${result.run.status.toLowerCase()}.`);
        }
      }
    }

    function startTimer() {
      if (timer != null || cancelled || TERMINAL.has(run.status)) {
        return;
      }
      timer = setInterval(() => {
        void poll();
      }, POLL_MS);
    }

    function stopTimer() {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        stopTimer();
        return;
      }
      void poll();
      startTimer();
    }

    void poll();
    startTimer();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      stopTimer();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [run.id, run.status, sequenceId]);

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={jobSequenceDetailPath(sequenceId)}
              label={`Back to ${run.sequenceName || 'sequence'}`}
            />
          }
          title={`Run #${run.id}`}
          status={{
            label: jobSequenceRunStatusLabel(run.status),
            variant: jobSequenceRunStatusVariant(run.status)
          }}
          meta={
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Sequence{' '}
                <Link
                  href={jobSequenceDetailPath(sequenceId)}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {run.sequenceName || `#${sequenceId}`}
                </Link>
              </p>
              <p>
                Started {formatJobSequenceTimestamp(run.startedAt)}
                {' · '}
                Finished {formatJobSequenceTimestamp(run.finishedAt)}
              </p>
              {run.status === 'RUNNING' ? (
                <p>Refreshing every {POLL_MS / 1000}s while this run is in progress…</p>
              ) : null}
              {run.errorMessage?.trim() ? (
                <p className="text-destructive" role="alert">
                  {run.errorMessage}
                </p>
              ) : null}
            </div>
          }
        />
      }
    >
      <DetailSection title="Step results">
        {run.steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No step results yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.steps.map((step) => {
                const jobDescription =
                  step.stepType === 'SCHEDULER_JOB'
                    ? schedulerJobDescription(
                        jobsByShortName.get(step.jobShortName?.trim() ?? '')
                      )
                    : undefined;
                return (
                <TableRow key={step.id}>
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={jobSequenceRunStatusVariant(step.status)}>
                      {jobSequenceRunStatusLabel(step.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {stepDurationLabel(step.startedAt, step.finishedAt)}
                  </TableCell>
                  <TableCell
                    className={
                      step.status === 'SKIPPED'
                        ? 'max-w-xs text-sm text-muted-foreground'
                        : 'max-w-xs text-sm text-destructive'
                    }
                  >
                    {step.status === 'SKIPPED'
                      ? step.errorMessage?.trim() || 'Skipped, inactive'
                      : step.errorMessage?.trim() || '—'}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DetailSection>
    </DetailPage>
  );
}
