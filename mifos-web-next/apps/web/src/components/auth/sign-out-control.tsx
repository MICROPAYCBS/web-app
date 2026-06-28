'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useQueryClient } from '@tanstack/react-query';
import { LogOutIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

/** Full-page navigation so the Route Handler can set cleared cookies on the response. */
export const LOGOUT_URL = '/api/auth/logout';

function clearClientAuthState(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.clear();
  queryClient.cancelQueries();
}

/** Clears client caches and navigates to the logout route handler. */
export function signOutFromClient(queryClient: ReturnType<typeof useQueryClient>) {
  clearClientAuthState(queryClient);
  window.location.assign(LOGOUT_URL);
}

export function SignOutButton({
  variant = 'outline',
  className,
  children = 'Sign out'
}: {
  variant?: ComponentProps<typeof Button>['variant'];
  className?: string;
  children?: ReactNode;
}) {
  const queryClient = useQueryClient();

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => signOutFromClient(queryClient)}
    >
      {children}
    </Button>
  );
}

/** Destructive sidebar user menu row — native link to {@link LOGOUT_URL}. */
export function SignOutMenuItem({ className }: { className?: string }) {
  const queryClient = useQueryClient();

  return (
    <DropdownMenuItem
      variant="destructive"
      className={className}
      render={
        <a
          href={LOGOUT_URL}
          className="flex w-full items-center gap-2"
          onClick={() => clearClientAuthState(queryClient)}
        />
      }
    >
      <LogOutIcon className="size-4" />
      Sign out
    </DropdownMenuItem>
  );
}
