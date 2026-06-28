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
import { createInactivityTimerController } from '@/lib/session/inactivity-timer';
import { signOutFromClient } from '@/components/auth/sign-out-control';

const INACTIVITY_TOAST_ID = 'session-inactivity-warning';

export function InactivityTimeout() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const config = useMemo(() => getInactivityTimeoutConfig(), []);

  useEffect(() => {
    if (!user || !config.enabled) {
      return;
    }

    const controller = createInactivityTimerController({
      timeoutMs: config.timeoutMs,
      warningMs: config.warningMs,
      onWarning: () => {
        toast.warning('Inactivity warning', {
          id: INACTIVITY_TOAST_ID,
          description: `You will be signed out in ${config.warningSeconds} seconds due to inactivity.`,
          duration: config.warningMs,
          action: {
            label: 'Stay logged in',
            onClick: () => controller.reset()
          }
        });
      },
      onTimeout: () => {
        toast.dismiss(INACTIVITY_TOAST_ID);
        signOutFromClient(queryClient);
      },
      onReset: () => {
        toast.dismiss(INACTIVITY_TOAST_ID);
      }
    });

    controller.start();

    return () => {
      toast.dismiss(INACTIVITY_TOAST_ID);
      controller.dispose();
    };
  }, [user, queryClient, config.enabled, config.timeoutMs, config.warningMs, config.warningSeconds]);

  return null;
}
