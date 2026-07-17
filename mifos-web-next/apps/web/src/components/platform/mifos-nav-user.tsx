'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { KeyRoundIcon } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@mifos/auth';
import { ChangePasswordDialog } from '@/components/auth/change-password-dialog';
import { SignOutMenuItem } from '@/components/auth/sign-out-control';
import { ThemeMenuGroup } from '@/components/theme/theme-menu-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

/** Account menu for the platform header (top-right). */
export function MifosNavUser() {
  const { user } = useSession();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (!user) {
    return null;
  }

  const displayName = user.displayName?.trim() || user.username;
  const branchLabel = user.officeName?.trim();
  const initials = userInitials(displayName);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={`Account menu for ${displayName}`}
            />
          }
        >
          <Avatar className="size-7 rounded-md">
            <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56" align="end" sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{displayName}</p>
                {branchLabel ? (
                  <p className="text-xs text-muted-foreground">Branch: {branchLabel}</p>
                ) : null}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <ThemeMenuGroup />
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
              <KeyRoundIcon className="size-4" />
              Change password
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <SignOutMenuItem />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </>
  );
}
