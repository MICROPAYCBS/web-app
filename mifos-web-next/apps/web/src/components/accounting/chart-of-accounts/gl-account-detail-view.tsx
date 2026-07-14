'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountEditData } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Lock, LockOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import {
  deleteGlAccountAction,
  toggleGlAccountDisabledAction
} from '@/actions/gl-accounts';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
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
import {
  formatGlAccountLabel,
  formatGlAccountTypeLabel
} from '@/lib/accounting/gl-account-display';
import { yesNoLabel } from '@/lib/fineract/user-display';
import { cn } from '@/lib/utils';

export function GlAccountDetailView({
  account,
  canCreate,
  canUpdate,
  canDelete
}: {
  account: FineractGlAccountEditData;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isHeader = account.usage.value === 'HEADER';

  function handleToggleDisabled() {
    setActionError(null);
    startTransition(async () => {
      const result = await toggleGlAccountDisabledAction(account.id, {
        disabled: !account.disabled
      });
      if (!result.ok) {
        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }
      toast.success(result.disabled ? 'Account disabled.' : 'Account enabled.');
      router.refresh();
    });
  }

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteGlAccountAction(account.id);
      if (!result.ok) {

        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'GL account deleted.', pending: 'GL account deleted sent for approval.' });
      router.push('/accounting/chart-of-accounts');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href="/accounting/chart-of-accounts" label="Back to chart of accounts" />
            }
            title={account.name}
            meta={`${account.glCode} · ${formatGlAccountTypeLabel(account.type)}`}
            status={
              account.disabled
                ? { label: 'Disabled', variant: 'secondary' }
                : { label: 'Enabled', variant: 'default' }
            }
            actions={
              <div className="flex flex-wrap gap-2">
                {canCreate && isHeader ? (
                  <Link
                    href={`/accounting/chart-of-accounts/create?parent=${account.id}&accountType=${account.type.id}`}
                    className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                  >
                    <Plus className="mr-2 size-4" />
                    Subledger account
                  </Link>
                ) : null}
                {canUpdate ? (
                  <Link
                    href={`/accounting/chart-of-accounts/${account.id}/edit`}
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
                ) : null}
                {canUpdate ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleDisabled}
                    disabled={pending}
                  >
                    {account.disabled ? (
                      <>
                        <LockOpen className="mr-2 size-4" />
                        Enable
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 size-4" />
                        Disable
                      </>
                    )}
                  </Button>
                ) : null}
                {canDelete ? (
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
          <DetailFieldGrid columns={2}>
            <DetailField label="Account type">{formatGlAccountTypeLabel(account.type)}</DetailField>
            <DetailField label="GL code">{account.glCode}</DetailField>
            <DetailField label="Usage">{account.usage.value}</DetailField>
            <DetailField label="Manual entries allowed">
              {yesNoLabel(account.manualEntriesAllowed)}
            </DetailField>
          </DetailFieldGrid>
        }
      >
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <DetailFieldGrid columns={1}>
            {account.parent ? (
              <DetailField label="Parent account">
                <Link
                  href={`/accounting/chart-of-accounts/${account.parent.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {formatGlAccountLabel(account.parent)}
                </Link>
              </DetailField>
            ) : null}
            {account.tagId?.name || account.tagId?.value ? (
              <DetailField label="Tag">{account.tagId.name ?? account.tagId.value}</DetailField>
            ) : null}
            <DetailField label="Description">{account.description?.trim() || '—'}</DetailField>
          </DetailFieldGrid>
        </div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      <Can permission="DELETE_GLACCOUNT">
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete GL account</DialogTitle>
              <DialogDescription>
                Delete &ldquo;{account.name}&rdquo; ({account.glCode})? This cannot be undone.
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
