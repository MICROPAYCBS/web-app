'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionsDetail } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteRoleAction, disableRoleAction, enableRoleAction } from '@/actions/system-roles';
import { DetailBackLink, DetailHeader, DetailPage } from '@/components/composites';
import { RolePermissionsPanel } from '@/components/system/role-permissions-panel';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { isSuperUserRole } from '@/lib/fineract/role-display';
import { cn } from '@/lib/utils';

export function RoleDetailView({
  role,
  canUpdate,
  canDelete
}: {
  role: FineractRolePermissionsDetail;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const protectedRole = isSuperUserRole(role.name);
  const canToggleEnabled = canUpdate && !protectedRole;

  function handleToggleEnabled(enabled: boolean) {
    setActionError(null);
    startTransition(async () => {
      const result = enabled ? await enableRoleAction(role.id) : await disableRoleAction(role.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteRoleAction(role.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      router.push('/system/roles-and-permissions');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href="/system/roles-and-permissions" label="Back to roles" />}
            title={role.name}
            status={
              role.disabled
                ? { label: 'Disabled', variant: 'secondary' }
                : { label: 'Enabled', variant: 'default' }
            }
            meta={role.description || 'No description provided.'}
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Link
                    href={`/system/roles-and-permissions/${role.id}?edit=1`}
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit description
                  </Link>
                ) : null}
                {canToggleEnabled ? (
                  role.disabled ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleEnabled(true)}
                      disabled={pending}
                    >
                      Enable role
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleEnabled(false)}
                      disabled={pending}
                    >
                      Disable role
                    </Button>
                  )
                ) : null}
                {canDelete && !protectedRole ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
        summary={
          protectedRole ? (
            <p className="text-sm text-muted-foreground">
              The Super user role cannot be disabled or deleted. You can still change its
              permissions (for example, remove broad grants such as all functions).
            </p>
          ) : null
        }
      >
        <RolePermissionsPanel
          roleId={role.id}
          permissions={role.permissionUsageData}
          canEdit={canUpdate}
        />

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      <Can permission="DELETE_ROLE">
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete role</DialogTitle>
              <DialogDescription>
                Delete &ldquo;{role.name}&rdquo;? Users assigned to this role will lose its
                permissions. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Can>
    </>
  );
}
