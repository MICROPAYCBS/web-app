'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FundMappingAdvanceSearchTemplate,
  FundMappingSearchResultItem
} from '@mifos/api-client';
import { Filter, Map, Search } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { searchFundMappingAction } from '@/actions/fund-mapping';
import {
  DEFAULT_FUND_MAPPING_SEARCH,
  FundMappingParameterSheet,
  type FundMappingSearchForm
} from '@/components/organization/fund-mapping-parameter-sheet';
import { FundMappingResultsTable } from '@/components/organization/fund-mapping-results-table';
import { EmptyState } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { Button } from '@/components/ui/button';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import type { FundMappingSearchInput } from '@mifos/validation';

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toSearchInput(form: FundMappingSearchForm): FundMappingSearchInput {
  return {
    loanStatus: form.loanStatus as FundMappingSearchInput['loanStatus'],
    loanProducts: form.loanProducts,
    offices: form.offices,
    loanDateOption: form.loanDateOption as FundMappingSearchInput['loanDateOption'],
    loanFromDate: form.loanFromDate,
    loanToDate: form.loanToDate,
    includeOutStandingAmountPercentage: form.includeOutStandingAmountPercentage,
    outStandingAmountPercentageCondition: form.includeOutStandingAmountPercentage
      ? form.outStandingAmountPercentageCondition || undefined
      : undefined,
    minOutStandingAmountPercentage: parseOptionalNumber(form.minOutStandingAmountPercentage),
    maxOutStandingAmountPercentage: parseOptionalNumber(form.maxOutStandingAmountPercentage),
    outStandingAmountPercentage: parseOptionalNumber(form.outStandingAmountPercentage),
    includeOutstandingAmount: form.includeOutstandingAmount,
    outstandingAmountCondition: form.includeOutstandingAmount
      ? form.outstandingAmountCondition || undefined
      : undefined,
    minOutstandingAmount: parseOptionalNumber(form.minOutstandingAmount),
    maxOutstandingAmount: parseOptionalNumber(form.maxOutstandingAmount),
    outstandingAmount: parseOptionalNumber(form.outstandingAmount),
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  };
}

export function FundMappingPageContent({
  template
}: {
  template: FundMappingAdvanceSearchTemplate;
}) {
  const [form, setForm] = useState<FundMappingSearchForm>(DEFAULT_FUND_MAPPING_SEARCH);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [items, setItems] = useState<FundMappingSearchResultItem[]>([]);
  const [pending, startTransition] = useTransition();

  function updateForm<K extends keyof FundMappingSearchForm>(
    key: K,
    value: FundMappingSearchForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function runSearch(nextForm: FundMappingSearchForm) {
    setFieldErrors({});
    startTransition(async () => {
      const result = await searchFundMappingAction(toSearchInput(nextForm));
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          setSheetOpen(true);
        }
        toast.error(result.message);
        return;
      }
      setItems(result.items);
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
        title="Fund mapping"
        description="Search loan portfolios by branch and product to review outstanding balances for fund source mapping."
        actions={hasSearched ? parametersButton : null}
      >
        {!hasSearched ? (
          <EmptyState
            icon={Map}
            title="No summary yet"
            description="Specify search parameters to view loan outstanding totals grouped by branch and product."
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
              {items.length} row{items.length === 1 ? '' : 's'}
            </p>
            <FundMappingResultsTable items={items} />
          </div>
        ) : (
          <EmptyState
            icon={Map}
            title="No matching loans"
            description="Try different search parameters and run the summary again."
            action={parametersButton}
          />
        )}
      </ListPage>

      <FundMappingParameterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={template}
        form={form}
        fieldErrors={fieldErrors}
        pending={pending}
        onFormChange={updateForm}
        onSubmit={() => runSearch(form)}
      />
    </>
  );
}
