'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateGlobalConfigurationEnabledAction } from '@/actions/global-configurations';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function ApprovalWorkflowsDisabledAlert({
  configuration,
  canUpdateConfiguration
}: {
  configuration: FineractGlobalConfiguration | null;
  canUpdateConfiguration: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(configuration?.enabled ?? false);
  const [pending, startTransition] = useTransition();

  if (!configuration || enabled) {
    return null;
  }

  function handleToggle(nextEnabled: boolean) {
    if (!canUpdateConfiguration || !configuration) {
      return;
    }

    setEnabled(nextEnabled);
    startTransition(async () => {
      const result = await updateGlobalConfigurationEnabledAction(configuration.id, nextEnabled);
      if (!result.ok) {
        setEnabled(!nextEnabled);
        toast.error(result.message);
        return;
      }
      toast.success(
        nextEnabled ? 'Approval workflows enabled for this institution.' : 'Approval workflows disabled.'
      );
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <p className="font-medium">Approval workflows are disabled for this institution</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Definitions you create here will not govern approvals until the institution enables the
        approval workflow engine.
      </p>
      {canUpdateConfiguration ? (
        <div className="mt-3 flex items-center gap-3">
          <Switch
            id="enable-approval-workflows"
            checked={enabled}
            disabled={pending}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="enable-approval-workflows">Enable approval workflows</Label>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Ask an administrator to enable approval workflows on the{' '}
          <Link href="/system/configurations" className="text-primary underline-offset-4 hover:underline">
            global configurations
          </Link>{' '}
          screen.
        </p>
      )}
    </div>
  );
}
