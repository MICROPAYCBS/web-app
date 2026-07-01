'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  StandingInstructionRunHistoryItem,
  StandingInstructionTemplate
} from '@mifos/api-client';
import { ArrowLeftRight, Filter, Search } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { toastFineractError } from '@/lib/toast-fineract-error';
import { searchStandingInstructionHistoryAction } from '@/actions/standing-instruction-history';
import {
  EMPTY_STANDING_INSTRUCTION_HISTORY_SEARCH,
  StandingInstructionHistoryParameterSheet,
  type StandingInstructionHistorySearchForm
} from '@/components/organization/standing-instruction-history-parameter-sheet';
import { StandingInstructionHistoryTable } from '@/components/organization/standing-instruction-history-table';
import { EmptyState } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { Button } from '@/components/ui/button';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';

export function StandingInstructionHistoryPageContent({
  template
}: {
  template: StandingInstructionTemplate;
}) {
  const [form, setForm] = useState<StandingInstructionHistorySearchForm>(
    EMPTY_STANDING_INSTRUCTION_HISTORY_SEARCH
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [items, setItems] = useState<StandingInstructionRunHistoryItem[]>([]);
  const [pending, startTransition] = useTransition();

  function updateForm<K extends keyof StandingInstructionHistorySearchForm>(
    key: K,
    value: StandingInstructionHistorySearchForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function runSearch(nextForm: StandingInstructionHistorySearchForm) {
    startTransition(async () => {
      const result = await searchStandingInstructionHistoryAction({
        clientName: nextForm.clientName || undefined,
        clientId: nextForm.clientId || undefined,
        transferType: nextForm.transferType ? Number(nextForm.transferType) : undefined,
        fromAccountType: nextForm.fromAccountType ? Number(nextForm.fromAccountType) : undefined,
        fromAccountId: nextForm.fromAccountId || undefined,
        fromDate: nextForm.fromDate || undefined,
        toDate: nextForm.toDate || undefined,
        locale: FINERACT_LOCALE,
        dateFormat: FINERACT_DATE_FORMAT
      });
      if (!result.ok) {
        toastFineractError(result.message);
        return;
      }
      setItems(result.data.pageItems);
      setHasSearched(true);
      setSheetOpen(false);
    });
  }

  const parametersButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => setSheetOpen(true)}
      disabled={pending}
    >
      <Filter className="mr-2 size-4" />
      Parameters
    </Button>
  );

  return (
    <>
      <ListPage
        title="Standing instructions history"
        description="Search execution history for standing instructions across the organization."
        actions={hasSearched ? parametersButton : null}
      >
        {!hasSearched ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No search results yet"
            description="Specify parameters to search standing instruction execution history."
            action={
              <Button type="button" onClick={() => setSheetOpen(true)} disabled={pending}>
                <Search className="mr-2 size-4" />
                Specify parameters
              </Button>
            }
          />
        ) : items.length ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {items.length} result{items.length === 1 ? '' : 's'}
            </p>
            <StandingInstructionHistoryTable items={items} />
          </div>
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title="No matching execution history"
            description="Try different search parameters and run the search again."
            action={parametersButton}
          />
        )}
      </ListPage>

      <StandingInstructionHistoryParameterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={template}
        form={form}
        onFormChange={updateForm}
        pending={pending}
        onSubmit={() => runSearch(form)}
      />
    </>
  );
}
