'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProvisioningCriteriaDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteProvisioningCriteriaAction } from '@/actions/provisioning-criteria';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatProvisioningLoanProducts } from '@/lib/fineract/provisioning-criteria-display';
import {
  provisioningCriteriaEditPath,
  PROVISIONING_CRITERIA_LIST_PATH
} from '@/lib/fineract/provisioning-criteria-paths';
import { cn } from '@/lib/utils';

export function ProvisioningCriteriaDetailView({
  criteria,
  canEdit,
  canDelete
}: {
  criteria: ProvisioningCriteriaDetail;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteProvisioningCriteriaAction(criteria.criteriaId);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(PROVISIONING_CRITERIA_LIST_PATH);
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
                href={PROVISIONING_CRITERIA_LIST_PATH}
                label="Back to provisioning criteria"
              />
            }
            title={criteria.criteriaName}
            actions={
              canEdit || canDelete ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={provisioningCriteriaEditPath(criteria.criteriaId)}
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
            <DetailField label="Loan products">
              {formatProvisioningLoanProducts(criteria.loanProducts)}
            </DetailField>
            <DetailField label="Created by">{criteria.createdBy ?? '—'}</DetailField>
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title="Provisioning definitions">
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Min age</TableHead>
                  <TableHead>Max age</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Liability account</TableHead>
                  <TableHead>Expense account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.definitions.map((definition) => (
                  <TableRow key={definition.categoryId}>
                    <TableCell className="font-medium">{definition.categoryName}</TableCell>
                    <TableCell>{definition.minAge ?? '—'}</TableCell>
                    <TableCell>{definition.maxAge ?? '—'}</TableCell>
                    <TableCell>{definition.provisioningPercentage ?? '—'}</TableCell>
                    <TableCell>{definition.liabilityName ?? '—'}</TableCell>
                    <TableCell>{definition.expenseName ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete provisioning criteria</DialogTitle>
            <DialogDescription>
              Delete &quot;{criteria.criteriaName}&quot;? This cannot be undone.
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
