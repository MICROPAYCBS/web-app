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

export function StructuredAccountNumberFormatsAlert({
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
        nextEnabled
          ? 'Structured account number formats enabled for this institution.'
          : 'Structured account number formats disabled.'
      );
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <p className="font-medium">Structured account number formats are disabled</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Enable structured formats to configure multi-segment patterns with branch codes, product
        codes, and check digits. Legacy prefix preferences continue to work until you turn this on.
      </p>
      {canUpdateConfiguration ? (
        <div className="mt-3 flex items-center gap-3">
          <Switch
            id="enable-structured-account-number-formats"
            checked={enabled}
            disabled={pending}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="enable-structured-account-number-formats">
            Enable structured account number formats
          </Label>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Ask an administrator to enable structured formats on the{' '}
          <Link href="/system/configurations" className="text-primary underline-offset-4 hover:underline">
            global configurations
          </Link>{' '}
          screen.
        </p>
      )}
    </div>
  );
}
