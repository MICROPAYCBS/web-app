'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractIncomeSourceOptions } from '@mifos/api-client';
import type { IncomeSourceInput } from '@mifos/validation';
import { Briefcase, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  incomeSourceInputDisplayName
} from '@/components/clients/detail/client-income-source-sections';
import { IncomeSourceFormSheet } from '@/components/clients/shared/income-source-form-sheet';
import { DraftCollectionView } from '@/components/clients/shared/draft-collection-view';
import type { CreateClientDraft } from '../types';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

const VIEW_MODE_STORAGE_KEY = 'mifos.create-client.income-sources.view-mode';

function incomeSourceTypeLabel(
  options: FineractIncomeSourceOptions | undefined,
  incomeSourceTypeId: number
): string | undefined {
  return options?.incomeSourceTypeOptions?.find((o) => o.id === incomeSourceTypeId)?.name;
}

export function IncomeSourceStep({
  incomeSourceOptions,
  draft,
  onIncomeSourcesChange
}: {
  incomeSourceOptions: FineractIncomeSourceOptions | undefined;
  draft: CreateClientDraft;
  onIncomeSourcesChange: (sources: IncomeSourceInput[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const sources = draft.incomeSources;

  function openAdd() {
    setEditIndex(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    setEditIndex(index);
    setDialogOpen(true);
  }

  function remove(index: number) {
    onIncomeSourcesChange(sources.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add income sources for this customer (optional). You can skip this step.
      </p>

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus className="mr-2 size-4" />
        Add income source
      </Button>

      {sources.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No income sources added yet"
          description="This step is optional. Add employment or business income if known."
        />
      ) : (
        <DraftCollectionView
          storageKey={VIEW_MODE_STORAGE_KEY}
          itemCount={sources.length}
          renderItems={(mode) =>
            sources.map((item, index) => {
              const title = incomeSourceInputDisplayName(
                item,
                incomeSourceTypeLabel(incomeSourceOptions, item.incomeSourceTypeId)
              );
              const onEdit = () => openEdit(index);
              const onDelete = () => remove(index);

              if (mode === 'grid') {
                return (
                  <div key={index} className="rounded-lg border p-4">
                    <p className="font-medium">{title}</p>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={onDelete}>
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <p className="font-medium">{title}</p>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                      Edit
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={onDelete}>
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })
          }
        />
      )}

      <IncomeSourceFormSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        options={incomeSourceOptions}
        incomeSource={editIndex != null ? sources[editIndex] : undefined}
        onSave={async (entry) => {
          const next = [...sources];
          const withMeta = { ...entry, dateFormat: FINERACT_DATE_FORMAT, locale: FINERACT_LOCALE };
          if (editIndex != null) {
            next[editIndex] = withMeta;
          } else {
            next.push(withMeta);
          }
          onIncomeSourcesChange(next);
          return { ok: true as const };
        }}
      />
    </div>
  );
}
