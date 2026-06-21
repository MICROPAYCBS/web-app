'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientIncomeSource, FineractIncomeSourceOptions } from '@mifos/api-client';
import { formatActionErrorMessage, type IncomeSourceInput } from '@mifos/validation';
import { Briefcase, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createClientIncomeSourceAction,
  deleteClientIncomeSourceAction,
  updateClientIncomeSourceAction
} from '@/actions/client-income-source';
import { IncomeSourceFormSheet } from '@/components/clients/shared/income-source-form-sheet';
import {
  formatIncomeSourceSummary,
  toIncomeSourceInput
} from '@/components/clients/detail/client-income-source-sections';
import {
  CollectionViewLayout,
  CollectionViewToggle,
  EmptyState,
  useCollectionViewMode
} from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import type { FormSubmitResult } from '@/lib/form/submit-result';

const VIEW_MODE_STORAGE_KEY = 'mifos.client-income-sources.view-mode';

export function ClientIncomeSourceView({
  clientId,
  incomeSources: initialSources,
  incomeSourceOptions,
  canUpdate
}: {
  clientId: string;
  incomeSources: FineractClientIncomeSource[];
  incomeSourceOptions: FineractIncomeSourceOptions | undefined;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSource, setEditSource] = useState<FineractClientIncomeSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FineractClientIncomeSource | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { mode, setMode } = useCollectionViewMode(VIEW_MODE_STORAGE_KEY, 'list');

  function refresh() {
    router.refresh();
  }

  function handleSave(entry: IncomeSourceInput): Promise<FormSubmitResult> {
    return (async () => {
      const payload = { ...entry, dateFormat: FINERACT_DATE_FORMAT, locale: FINERACT_LOCALE };
      const result = editSource
        ? await updateClientIncomeSourceAction(clientId, editSource.id, payload)
        : await createClientIncomeSourceAction(clientId, payload);

      if (!result.ok) {
        return {
          ok: false as const,
          message: formatActionErrorMessage(result.message, result.fieldErrors)
        };
      }
      setEditSource(null);
      refresh();
      return { ok: true as const };
    })();
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteClientIncomeSourceAction(clientId, deleteTarget.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteTarget(null);
      refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Income sources</h1>
          <p className="text-sm text-muted-foreground">
            Employment, business, and other income linked to this customer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CollectionViewToggle mode={mode} onModeChange={setMode} />
          {canUpdate ? (
            <Button type="button" size="sm" onClick={() => { setEditSource(null); setDialogOpen(true); }}>
              <Plus className="mr-2 size-4" />
              Add income source
            </Button>
          ) : null}
        </div>
      </div>

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

      {initialSources.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No income sources recorded"
          description="Add employment, business, or other income details for this customer."
        />
      ) : (
        <CollectionViewLayout mode={mode}>
          {initialSources.map((item) => {
            const summary = (
              <>
                <p className="font-medium">{formatIncomeSourceSummary(item)}</p>
                {item.sourceOfFunds ? (
                  <p className="text-sm text-muted-foreground">Source of funds: {item.sourceOfFunds}</p>
                ) : null}
                {item.employerAddress ? (
                  <p className="text-sm text-muted-foreground">{item.employerAddress}</p>
                ) : null}
                {item.subIndustryName ? (
                  <p className="text-sm text-muted-foreground">{item.subIndustryName}</p>
                ) : null}
              </>
            );

            const actions = canUpdate ? (
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditSource(item);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(item)}>
                  Delete
                </Button>
              </div>
            ) : null;

            if (mode === 'grid') {
              return (
                <div key={item.id} className="rounded-lg border p-4">
                  {summary}
                  {canUpdate ? <div className="mt-3 flex gap-2">{actions}</div> : null}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div>{summary}</div>
                {actions}
              </div>
            );
          })}
        </CollectionViewLayout>
      )}

      <IncomeSourceFormSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        options={incomeSourceOptions}
        incomeSource={editSource ? toIncomeSourceInput(editSource) : undefined}
        onSave={handleSave}
        submitLoading={pending}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete income source?</DialogTitle>
            <DialogDescription>
              This removes the income source record for this customer. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
