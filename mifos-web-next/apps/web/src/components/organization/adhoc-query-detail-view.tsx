'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AdhocQueryDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteAdhocQueryAction } from '@/actions/adhoc-query';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Badge } from '@/components/ui/badge';
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
  ADHOC_QUERY_LIST_PATH,
  adhocQueryEditPath
} from '@/lib/fineract/adhoc-query-paths';
import {
  formatAdhocQueryActive,
  resolveReportRunFrequencyLabel
} from '@/lib/fineract/adhoc-query-display';
import { cn } from '@/lib/utils';

export function AdhocQueryDetailView({
  query,
  canEdit,
  canDelete
}: {
  query: AdhocQueryDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const frequencyLabel = resolveReportRunFrequencyLabel(
    query.reportRunFrequency,
    query.reportRunFrequencies
  );

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteAdhocQueryAction(query.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(ADHOC_QUERY_LIST_PATH);
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={ADHOC_QUERY_LIST_PATH} label="Back to ad hoc queries" />
            }
            title={query.name}
            actions={
              canEdit || canDelete ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={adhocQueryEditPath(query.id)}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Pencil className="mr-1 size-4" />
                      Edit
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-1 size-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              ) : null
            }
          />
        }
      >
        <DetailSection title="Overview">
          <DetailFieldGrid>
            <DetailField label="SQL query">
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                {query.query ?? '—'}
              </pre>
            </DetailField>
            <DetailField label="Table affected">{query.tableName ?? '—'}</DetailField>
            <DetailField label="Table fields">
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
                {query.tableFields ?? '—'}
              </pre>
            </DetailField>
            <DetailField label="Email">{query.email ?? '—'}</DetailField>
            {query.reportRunFrequency != null && query.reportRunFrequency !== '' ? (
              <DetailField label="Report run frequency">{frequencyLabel}</DetailField>
            ) : null}
            <DetailField label="Status">
              <Badge variant={query.isActive ? 'default' : 'secondary'}>
                {formatAdhocQueryActive(query.isActive)}
              </Badge>
            </DetailField>
            <DetailField label="Created by">{query.createdBy ?? '—'}</DetailField>
          </DetailFieldGrid>
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete ad hoc query</DialogTitle>
            <DialogDescription>
              Delete &quot;{query.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? (
            <p className="text-sm text-destructive">{actionError}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
