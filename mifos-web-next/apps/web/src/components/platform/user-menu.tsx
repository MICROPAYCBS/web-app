'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { logoutAction } from '@/actions/auth';
import { useSession } from '@mifos/auth';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { user } = useSession();
  const [pending, startTransition] = useTransition();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline">
        {user.username}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => logoutAction())}
      >
        <LogOut className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:ml-1.5">Sign out</span>
      </Button>
    </div>
  );
}
