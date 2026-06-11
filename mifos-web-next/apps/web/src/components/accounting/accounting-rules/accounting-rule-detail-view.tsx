'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountingRuleDetail } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteAccountingRuleAction } from '@/actions/accounting-rules';
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
  formatAccountingRuleCreditAccount,
  formatAccountingRuleCreditTags,
  formatAccountingRuleDebitAccount,
  formatAccountingRuleDebitTags,
  yesNoLabel
} from '@/lib/accounting/accounting-rule-display';
import { cn } from '@/lib/utils';

export function AccountingRuleDetailView({
  rule,
  canUpdate,
  canDelete
}: {
  rule: FineractAccountingRuleDetail;
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
      const result = await deleteAccountingRuleAction(rule.id);
      if (!result.ok) {
        setActionError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success('Accounting rule deleted.');
      router.push('/accounting/accounting-rules');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href="/accounting/accounting-rules" label="Back to accounting rules" />
            }
            title={rule.name}
            meta={rule.officeName}
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Link
                    href={`/accounting/accounting-rules/${rule.id}/edit`}
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
            <DetailField label="Branch">{rule.officeName}</DetailField>
            {rule.description ? <DetailField label="Description">{rule.description}</DetailField> : null}
            <DetailField label="Multiple debit entries allowed">
              {yesNoLabel(rule.allowMultipleDebitEntries)}
            </DetailField>
            <DetailField label="Multiple credit entries allowed">
              {yesNoLabel(rule.allowMultipleCreditEntries)}
            </DetailField>
          </DetailFieldGrid>
        }
      >
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <DetailFieldGrid columns={1}>
            {rule.debitTags?.length ? (
              <DetailField label="Debit tags">{formatAccountingRuleDebitTags(rule)}</DetailField>
            ) : null}
            {rule.debitAccounts?.length ? (
              <DetailField label="Debit account">{formatAccountingRuleDebitAccount(rule)}</DetailField>
            ) : null}
            {rule.creditTags?.length ? (
              <DetailField label="Credit tags">{formatAccountingRuleCreditTags(rule)}</DetailField>
            ) : null}
            {rule.creditAccounts?.length ? (
              <DetailField label="Credit account">{formatAccountingRuleCreditAccount(rule)}</DetailField>
            ) : null}
          </DetailFieldGrid>
        </div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      <Can permission="DELETE_ACCOUNTINGRULE">
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete accounting rule</DialogTitle>
              <DialogDescription>
                Delete &ldquo;{rule.name}&rdquo;? This cannot be undone.
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
