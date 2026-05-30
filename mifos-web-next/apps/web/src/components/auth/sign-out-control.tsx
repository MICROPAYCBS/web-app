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
import { useFormStatus } from 'react-dom';
import type { ComponentProps, ReactNode } from 'react';
import { logoutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

function clearClientAuthState(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.clear();
  queryClient.cancelQueries();
}

function SignOutFormShell({
  children,
  className,
  onSubmit
}: {
  children: ReactNode;
  className?: string;
  onSubmit: () => void;
}) {
  return (
    <form action={logoutAction} className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function SignOutSubmitButton({
  children,
  variant = 'outline',
  className
}: {
  children: ReactNode;
  variant?: ComponentProps<typeof Button>['variant'];
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} className={className} disabled={pending}>
      {pending ? 'Signing out…' : children}
    </Button>
  );
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
    <SignOutFormShell onSubmit={() => clearClientAuthState(queryClient)}>
      <SignOutSubmitButton variant={variant} className={className}>
        {children}
      </SignOutSubmitButton>
    </SignOutFormShell>
  );
}

function SignOutMenuSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
    >
      <LogOutIcon className="size-4" />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

/** Destructive sidebar / header menu row wired to {@link logoutAction}. */
export function SignOutMenuItem({ className }: { className?: string }) {
  const queryClient = useQueryClient();

  return (
    <DropdownMenuItem
      variant="destructive"
      className={cn('p-0 focus:bg-transparent', className)}
      onSelect={(event) => event.preventDefault()}
    >
      <SignOutFormShell
        className="w-full"
        onSubmit={() => clearClientAuthState(queryClient)}
      >
        <SignOutMenuSubmit />
      </SignOutFormShell>
    </DropdownMenuItem>
  );
}
