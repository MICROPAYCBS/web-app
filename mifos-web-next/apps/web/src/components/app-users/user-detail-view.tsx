'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserDetail } from '@mifos/api-client';
import { Can, resolvePermission } from '@mifos/auth';
import { KeyRound, Pencil, ShieldOff, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { deleteUserAction, resetUserTotpAction } from '@/actions/app-users';
import { ChangePasswordDialog } from '@/components/app-users/change-password-dialog';
import { UserRolesBadges } from '@/components/app-users/user-roles-badges';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { formatUserDisplayName, yesNoLabel } from '@/lib/fineract/user-display';
import { cn } from '@/lib/utils';

export function UserDetailView({
  user,
  canUpdate,
  canDelete,
  canResetTotp
}: {
  user: FineractUserDetail;
  canUpdate: boolean;
  canDelete: boolean;
  canResetTotp: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetTotpOpen, setResetTotpOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const displayName = formatUserDisplayName(user);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (!result.ok) {
        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, {
        completed: 'User deleted.',
        pending: 'User deletion sent for approval.'
      });
      setDeleteOpen(false);
      router.push('/appusers');
      router.refresh();
    });
  }

  function handleResetTotp() {
    setActionError(null);
    startTransition(async () => {
      const result = await resetUserTotpAction(user.id);
      if (!result.ok) {
        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Authenticator enrollment reset.',
        pending: 'Authenticator reset sent for approval.'
      });
      setResetTotpOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href="/appusers" label="Back to users" />}
            title={displayName}
            meta={
              <div className="space-y-2">
                <p>{user.username}</p>
                <UserRolesBadges roles={user.selectedRoles} />
              </div>
            }
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <>
                    <Link href={`/appusers/${user.id}/edit`} className={cn(buttonVariants({ size: 'sm' }))}>
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPasswordOpen(true)}
                      disabled={pending}
                    >
                      <KeyRound className="mr-2 size-4" />
                      Change password
                    </Button>
                  </>
                ) : null}
                <Can permission={resolvePermission('administration.users.resetTotp')}>
                  {canResetTotp && user.totpEnabled ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setResetTotpOpen(true)}
                      disabled={pending}
                    >
                      <ShieldOff className="mr-2 size-4" />
                      Reset authenticator
                    </Button>
                  ) : null}
                </Can>
                <Can permission="DELETE_USER">
                  {canDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteOpen(true)}
                      disabled={pending}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  ) : null}
                </Can>
              </div>
            }
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="Login name">{user.username}</DetailField>
            <DetailField label="Email">{user.email || '—'}</DetailField>
            <DetailField label="First name">{user.firstname || '—'}</DetailField>
            <DetailField label="Last name">{user.lastname || '—'}</DetailField>
            <DetailField label="Office">{user.officeName || '—'}</DetailField>
            <DetailField label="Staff">{user.staff?.displayName || '—'}</DetailField>
            <DetailField label="Self service user">{yesNoLabel(user.isSelfServiceUser)}</DetailField>
            <DetailField label="Password never expires">{yesNoLabel(user.passwordNeverExpires)}</DetailField>
            <DetailField label="Login retry limit">{yesNoLabel(user.isLoginRetriesEnabled)}</DetailField>
            <DetailField label="Allow password reset">{yesNoLabel(user.isPasswordResetAllowed)}</DetailField>
            <DetailField label="Authenticator enrolled">{yesNoLabel(user.totpEnabled)}</DetailField>
          </DetailFieldGrid>
        }
      >
        <DetailSection
          title="Roles"
          description="Roles determine which actions this user can perform in the application."
        >
          <UserRolesBadges roles={user.selectedRoles} />
        </DetailSection>
      </DetailPage>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        userId={user.id}
        firstname={user.firstname}
      />

      <Dialog open={resetTotpOpen} onOpenChange={(next) => !pending && setResetTotpOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset authenticator</DialogTitle>
            <DialogDescription>
              Clear authenticator enrollment for <strong>{displayName}</strong>? They will need to set
              up their app again on next sign-in when authenticator verification is required.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetTotpOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleResetTotp} disabled={pending}>
              Reset authenticator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(next) => !pending && setDeleteOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Delete <strong>{displayName}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
