'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractHookDetail } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteHookAction } from '@/actions/hooks';
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
  formatHookDate,
  formatHookEventLabel,
  hookConfigValue,
  hookTemplateLabel
} from '@/lib/fineract/hook-display';
import { cn } from '@/lib/utils';

export function HookDetailView({
  hook,
  canUpdate,
  canDelete
}: {
  hook: FineractHookDetail;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteHookAction(hook.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      router.push('/system/hooks');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href="/system/hooks" label="Back to hooks" />}
            title={hook.displayName}
            status={
              hook.isActive
                ? { label: 'Active', variant: 'default' }
                : { label: 'Inactive', variant: 'secondary' }
            }
            meta={`${hookTemplateLabel(hook.name)} hook configuration.`}
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Link
                    href={`/system/hooks/${hook.id}/edit`}
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
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
            <DetailField label="Template">{hookTemplateLabel(hook.name)}</DetailField>
            <DetailField label="Events">{hook.events?.length ?? 0}</DetailField>
            <DetailField label="Created">{formatHookDate(hook.createdAt)}</DetailField>
            <DetailField label="Updated">{formatHookDate(hook.updatedAt)}</DetailField>
          </DetailFieldGrid>
        }
      >
        <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <DetailFieldGrid columns={2}>
            {hook.name === 'Web' ? (
              <>
                <DetailField label="Content type">
                  {hookConfigValue(hook.config, 'Content Type', 0) || '—'}
                </DetailField>
                <DetailField label="Payload URL">
                  {hookConfigValue(hook.config, 'Payload URL', 1) || '—'}
                </DetailField>
              </>
            ) : (
              <>
                <DetailField label="Payload URL">
                  {hookConfigValue(hook.config, 'Payload URL', 0) || '—'}
                </DetailField>
                <DetailField label="Phone number">
                  {hookConfigValue(hook.config, 'Phone Number', 1) || '—'}
                </DetailField>
                <DetailField label="SMS provider">
                  {hookConfigValue(hook.config, 'SMS Provider', 2) || '—'}
                </DetailField>
                <DetailField label="SMS provider account ID">
                  {hookConfigValue(hook.config, 'SMS Provider Account Id', 3) || '—'}
                </DetailField>
                <DetailField label="SMS provider token">
                  {hookConfigValue(hook.config, 'SMS Provider Token', 4) || '—'}
                </DetailField>
              </>
            )}
          </DetailFieldGrid>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Events</h3>
            {hook.events?.length ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {hook.events.map((event, index) => (
                  <li key={`${event.entityName}-${event.actionName}-${index}`}>
                    {formatHookEventLabel(event)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No events configured.</p>
            )}
          </div>
        </div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      <Can permission="DELETE_HOOK">
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete hook</DialogTitle>
              <DialogDescription>
                Delete &ldquo;{hook.displayName}&rdquo;? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
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
