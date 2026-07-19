'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductKind } from '@mifos/api-client';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import {
  LOAN_PRODUCT_KIND,
  loanProductKindLabel
} from '@/lib/fineract/loan-product-paths';

const PRODUCT_TYPE_OPTIONS: { value: LoanProductKind; label: string }[] = [
  { value: LOAN_PRODUCT_KIND.LOAN, label: loanProductKindLabel(LOAN_PRODUCT_KIND.LOAN) },
  {
    value: LOAN_PRODUCT_KIND.WORKING_CAPITAL,
    label: loanProductKindLabel(LOAN_PRODUCT_KIND.WORKING_CAPITAL)
  }
];

export function LoanProductsFilterSheet({
  open,
  onOpenChange,
  draftKind,
  onDraftKindChange,
  onApply,
  onClear
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftKind: LoanProductKind;
  onDraftKindChange: (kind: LoanProductKind) => void;
  onApply: (kind: LoanProductKind) => void;
  onClear: () => void;
}) {
  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter loan products"
      description="Choose which loan product catalog to browse."
      applyLabel="Apply filters"
      onApply={() => onApply(draftKind)}
      onClear={onClear}
    >
      <ListFilterSection title="Product type">
        <SelectField
          id="loan-product-kind-filter"
          label="Product type"
          required
          value={draftKind}
          onValueChange={(value) => {
            if (value === LOAN_PRODUCT_KIND.LOAN || value === LOAN_PRODUCT_KIND.WORKING_CAPITAL) {
              onDraftKindChange(value);
            }
          }}
          options={PRODUCT_TYPE_OPTIONS}
        />
      </ListFilterSection>
    </ListFilterSheet>
  );
}

export function countActiveLoanProductFilters(kind: LoanProductKind): number {
  return kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL ? 1 : 0;
}
