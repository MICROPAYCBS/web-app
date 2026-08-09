'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSchedulerJob } from '@mifos/api-client';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchSchedulerJobAction,
  fetchSchedulerJobsAction
} from '@/actions/jobs';

const POLL_MS = 4000;
/** Keep polling briefly after execute so currentlyRunning can flip on. */
const GRACE_MS = 20_000;

function useWatchGrace() {
  const [watchUntil, setWatchUntil] = useState<number | null>(null);

  useEffect(() => {
    if (watchUntil == null) {
      return;
    }
    const remaining = watchUntil - Date.now();
    if (remaining <= 0) {
      setWatchUntil(null);
      return;
    }
    const timer = setTimeout(() => setWatchUntil(null), remaining);
    return () => clearTimeout(timer);
  }, [watchUntil]);

  const startWatching = useCallback(() => {
    setWatchUntil(Date.now() + GRACE_MS);
  }, []);

  return { inGrace: watchUntil != null, startWatching };
}

/**
 * Polls the jobs list while any job is running, or during a short post-execute grace window.
 * Pauses when the document tab is hidden.
 */
export function useSchedulerJobsPolling(initialJobs: FineractSchedulerJob[]) {
  const [jobs, setJobs] = useState(initialJobs);
  const { inGrace, startWatching } = useWatchGrace();
  const shouldPoll = inGrace || jobs.some((job) => job.currentlyRunning);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      if (document.visibilityState === 'hidden') {
        return;
      }
      const result = await fetchSchedulerJobsAction();
      if (cancelled || !result.ok) {
        return;
      }
      setJobs(result.jobs);
    }

    function startTimer() {
      if (timer != null || cancelled) {
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
  }, [shouldPoll]);

  return { jobs, startWatching };
}

/**
 * Polls a single job while it is running, or during a short post-execute grace window.
 */
export function useSchedulerJobPolling(initialJob: FineractSchedulerJob) {
  const [job, setJob] = useState(initialJob);
  const { inGrace, startWatching } = useWatchGrace();
  const shouldPoll = inGrace || job.currentlyRunning;

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const jobId = job.jobId;

    async function poll() {
      if (document.visibilityState === 'hidden') {
        return;
      }
      const result = await fetchSchedulerJobAction(jobId);
      if (cancelled || !result.ok) {
        return;
      }
      setJob(result.job);
    }

    function startTimer() {
      if (timer != null || cancelled) {
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
  }, [job.jobId, shouldPoll]);

  return { job, startWatching };
}
