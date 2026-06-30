'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFinancialActivityMappingDetail } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { deleteFinancialActivityMappingAction } from '@/actions/financial-activity-mappings';
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
  formatFinancialActivityGlAccountLabel,
  formatFinancialActivityNameOnly,
  formatMappedGlAccountTypeLabel
} from '@/lib/accounting/financial-activity-mapping-display';
import { cn } from '@/lib/utils';

export function FinancialActivityMappingDetailView({
  mapping,
  canUpdate,
  canDelete
}: {
  mapping: FineractFinancialActivityMappingDetail;
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
      const result = await deleteFinancialActivityMappingAction(mapping.id);
      if (!result.ok) {

        setActionError(result.message);
        toast.error(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Financial activity mapping deleted.', pending: 'Financial activity mapping deleted sent for approval.' });
      router.push('/accounting/financial-activity-mappings');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink
                href="/accounting/financial-activity-mappings"
                label="Back to financial activity mappings"
              />
            }
            title={formatFinancialActivityNameOnly(mapping.financialActivityData)}
            meta={formatFinancialActivityGlAccountLabel(mapping.glAccountData)}
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Link
                    href={`/accounting/financial-activity-mappings/${mapping.id}/edit`}
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
            <DetailField label="Financial activity">
              ({mapping.financialActivityData.id}){' '}
              {formatFinancialActivityNameOnly(mapping.financialActivityData)}
            </DetailField>
            <DetailField label="Account type">
              {formatMappedGlAccountTypeLabel(mapping.financialActivityData.mappedGLAccountType)}
            </DetailField>
          </DetailFieldGrid>
        }
      >
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <DetailFieldGrid columns={1}>
            <DetailField label="Account code">{mapping.glAccountData.glCode}</DetailField>
            <DetailField label="Account name">
              {formatFinancialActivityGlAccountLabel(mapping.glAccountData)}
            </DetailField>
          </DetailFieldGrid>
        </div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      <Can permission="DELETE_FINANCIALACTIVITYACCOUNT">
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete mapping</DialogTitle>
              <DialogDescription>
                Delete the mapping for &ldquo;
                {formatFinancialActivityNameOnly(mapping.financialActivityData)}&rdquo;? This cannot
                be undone.
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
