'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@mifos/auth';
import { toast } from 'sonner';
import { getInactivityTimeoutConfig } from '@/lib/session/inactivity-timeout-config';
import {
  formatIdleWarningDescription,
  remainingIdleWarningSeconds
} from '@/lib/session/idle-warning-copy';
import { createInactivityTimerController } from '@/lib/session/inactivity-timer';
import { signOutFromClient } from '@/components/auth/sign-out-control';

const INACTIVITY_TOAST_ID = 'session-inactivity-warning';

export function InactivityTimeout() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const config = useMemo(
    () =>
      getInactivityTimeoutConfig(process.env, {
        sessionIdleTimeoutMinutes: user?.sessionIdleTimeoutMinutes,
        sessionIdleWarningSeconds: user?.sessionIdleWarningSeconds
      }),
    [user?.sessionIdleTimeoutMinutes, user?.sessionIdleWarningSeconds]
  );

  useEffect(() => {
    if (!user || !config.enabled) {
      return;
    }

    let countdownInterval: ReturnType<typeof setInterval> | undefined;
    let warningDeadlineMs: number | undefined;

    const clearCountdown = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = undefined;
      }
      warningDeadlineMs = undefined;
    };

    const showWarningToast = () => {
      if (warningDeadlineMs == null) {
        return;
      }
      const secondsRemaining = remainingIdleWarningSeconds(warningDeadlineMs);
      toast.warning('Inactivity warning', {
        id: INACTIVITY_TOAST_ID,
        description: formatIdleWarningDescription(secondsRemaining),
        duration: Math.max(0, warningDeadlineMs - Date.now()),
        action: {
          label: 'Stay logged in',
          onClick: () => controller.reset()
        }
      });
    };

    const controller = createInactivityTimerController({
      timeoutMs: config.timeoutMs,
      warningMs: config.warningMs,
      onWarning: () => {
        clearCountdown();
        warningDeadlineMs = Date.now() + config.warningMs;
        showWarningToast();
        countdownInterval = setInterval(() => {
          if (warningDeadlineMs == null) {
            return;
          }
          if (remainingIdleWarningSeconds(warningDeadlineMs) <= 0) {
            clearCountdown();
            return;
          }
          showWarningToast();
        }, 1000);
      },
      onTimeout: () => {
        clearCountdown();
        toast.dismiss(INACTIVITY_TOAST_ID);
        signOutFromClient(queryClient);
      },
      onReset: () => {
        clearCountdown();
        toast.dismiss(INACTIVITY_TOAST_ID);
      }
    });

    controller.start();

    return () => {
      clearCountdown();
      toast.dismiss(INACTIVITY_TOAST_ID);
      controller.dispose();
    };
  }, [user, queryClient, config.enabled, config.timeoutMs, config.warningMs]);

  return null;
}
