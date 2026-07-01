'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  BulkLoanReassignmentAccountOwner,
  BulkLoanReassignmentAccountSummaryCollection,
  BulkLoanReassignmentLoanOfficerOption,
  BulkLoanReassignmentLoanSummary
} from '@mifos/api-client';
import type { FineractOfficeOption } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import {
  loadBulkLoanReassignmentOfficeTemplateAction,
  loadBulkLoanReassignmentOfficerTemplateAction,
  submitBulkLoanReassignmentAction
} from '@/actions/bulk-loan-reassignment';
import { DateField } from '@/components/composites/date-field';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatBulkLoanReassignmentLoanLabel } from '@/lib/fineract/bulk-loan-reassignment-display';
import { toSelectOptions } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';

type BulkLoanReassignmentFormState = {
  officeId: string;
  assignmentDate: string;
  fromLoanOfficerId: string;
  toLoanOfficerId: string;
};

function defaultFormState(): BulkLoanReassignmentFormState {
  return {
    officeId: '',
    assignmentDate: '',
    fromLoanOfficerId: '',
    toLoanOfficerId: ''
  };
}

function LoanOwnerSection({
  title,
  owners,
  selectedLoanIds,
  disabled,
  onToggleLoan
}: {
  title: string;
  owners: BulkLoanReassignmentAccountOwner[];
  selectedLoanIds: Set<number>;
  disabled: boolean;
  onToggleLoan: (loanId: number, checked: boolean) => void;
}) {
  if (!owners.length) {
    return (
      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-2 text-sm font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">No loans found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-4 text-sm font-medium">{title}</h3>
      <div className="space-y-4">
        {owners.map((owner) => (
          <div key={owner.displayName} className="space-y-2">
            <p className="text-sm font-medium">{owner.displayName}</p>
            <div className="space-y-2 pl-2">
              {owner.loans.map((loan) => (
                <LoanCheckboxRow
                  key={loan.id}
                  loan={loan}
                  checked={selectedLoanIds.has(loan.id)}
                  disabled={disabled}
                  onCheckedChange={(checked) => onToggleLoan(loan.id, checked)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoanCheckboxRow({
  loan,
  checked,
  disabled,
  onCheckedChange
}: {
  loan: BulkLoanReassignmentLoanSummary;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const label = formatBulkLoanReassignmentLoanLabel(loan);
  return (
    <label className="flex items-start gap-2 text-sm">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span>{label}</span>
    </label>
  );
}

export function BulkLoanReassignmentPageContent({
  offices,
  canSubmit
}: {
  offices: FineractOfficeOption[];
  canSubmit: boolean;
}) {
  const [form, setForm] = useState<BulkLoanReassignmentFormState>(defaultFormState);
  const [fromLoanOfficers, setFromLoanOfficers] = useState<
    BulkLoanReassignmentLoanOfficerOption[]
  >([]);
  const [accountSummary, setAccountSummary] =
    useState<BulkLoanReassignmentAccountSummaryCollection | null>(null);
  const [selectedLoanIds, setSelectedLoanIds] = useState<Set<number>>(() => new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingOffice, startOfficeTransition] = useTransition();
  const [loadingOfficer, startOfficerTransition] = useTransition();
  const [pending, startSubmitTransition] = useTransition();

  const officeOptions = useMemo(() => toSelectOptions(offices), [offices]);

  const toLoanOfficerOptions = useMemo(
    () =>
      toSelectOptions(
        fromLoanOfficers.filter(
          (officer) => String(officer.id) !== form.fromLoanOfficerId
        )
      ),
    [fromLoanOfficers, form.fromLoanOfficerId]
  );

  const fromLoanOfficerOptions = useMemo(
    () => toSelectOptions(fromLoanOfficers),
    [fromLoanOfficers]
  );

  const disabled = pending || !canSubmit;

  function patchForm(patch: Partial<BulkLoanReassignmentFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleOfficeChange(officeId: string) {
    patchForm({
      officeId,
      fromLoanOfficerId: '',
      toLoanOfficerId: ''
    });
    setFromLoanOfficers([]);
    setAccountSummary(null);
    setSelectedLoanIds(new Set());
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.fromLoanOfficerId;
      delete next.toLoanOfficerId;
      delete next.loans;
      return next;
    });

    if (!officeId) {
      return;
    }

    startOfficeTransition(async () => {
      const result = await loadBulkLoanReassignmentOfficeTemplateAction(officeId);
      if (!result.ok) {

        toast.error(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Loans reassigned.', pending: 'Loans reassigned sent for approval.' });
      setFromLoanOfficers(result.data.loanOfficerOptions);
    });
  }

  function handleFromOfficerChange(fromLoanOfficerId: string) {
    patchForm({
      fromLoanOfficerId,
      toLoanOfficerId: ''
    });
    setAccountSummary(null);
    setSelectedLoanIds(new Set());
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.loans;
      return next;
    });

    if (!fromLoanOfficerId || !form.officeId) {
      return;
    }

    startOfficerTransition(async () => {
      const result = await loadBulkLoanReassignmentOfficerTemplateAction(
        form.officeId,
        fromLoanOfficerId
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setAccountSummary(result.data.accountSummaryCollection);
    });
  }

  function toggleLoan(loanId: number, checked: boolean) {
    setSelectedLoanIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(loanId);
      } else {
        next.delete(loanId);
      }
      return next;
    });
    setFieldErrors((current) => {
      if (!current.loans) {
        return current;
      }
      const next = { ...current };
      delete next.loans;
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startSubmitTransition(async () => {
      const result = await submitBulkLoanReassignmentAction({
        officeId: Number(form.officeId),
        assignmentDate: form.assignmentDate,
        fromLoanOfficerId: Number(form.fromLoanOfficerId),
        toLoanOfficerId: Number(form.toLoanOfficerId),
        loans: [...selectedLoanIds]
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      setForm(defaultFormState());
      setFromLoanOfficers([]);
      setAccountSummary(null);
      setSelectedLoanIds(new Set());
    });
  }

  const showFromOfficer = form.officeId !== '' && fromLoanOfficers.length > 0;
  const showLoanSelection = accountSummary != null;

  return (
    <ListPage
      title="Bulk loan reassignment"
      description="Reassign selected loans from one loan officer to another within a branch."
    >
      <form className="mx-auto max-w-5xl space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            id="bulk-loan-office"
            label="Branch"
            required
            value={form.officeId || undefined}
            onValueChange={(value) => handleOfficeChange(value ?? '')}
            options={officeOptions}
            placeholder="Select branch"
            error={fieldErrors.officeId}
            disabled={disabled || loadingOffice}
          />

          <DateField
            id="bulk-loan-assignment-date"
            label="Assignment date"
            required
            value={form.assignmentDate}
            onChange={(value) => patchForm({ assignmentDate: value ?? '' })}
            error={fieldErrors.assignmentDate}
            disabled={disabled}
          />
        </div>

        {showFromOfficer ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="bulk-loan-from-officer"
              label="From loan officer"
              required
              value={form.fromLoanOfficerId || undefined}
              onValueChange={(value) => handleFromOfficerChange(value ?? '')}
              options={fromLoanOfficerOptions}
              placeholder="Select loan officer"
              error={fieldErrors.fromLoanOfficerId}
              disabled={disabled || loadingOffice || loadingOfficer}
            />

            <SelectField
              id="bulk-loan-to-officer"
              label="To loan officer"
              required
              value={form.toLoanOfficerId || undefined}
              onValueChange={(value) => patchForm({ toLoanOfficerId: value ?? '' })}
              options={toLoanOfficerOptions}
              placeholder="Select loan officer"
              error={fieldErrors.toLoanOfficerId}
              disabled={disabled || !form.fromLoanOfficerId || loadingOfficer}
            />
          </div>
        ) : null}

        {showLoanSelection ? (
          <div className="space-y-3">
            <div className="grid gap-4 lg:grid-cols-2">
              <LoanOwnerSection
                title="Customers"
                owners={accountSummary.clients}
                selectedLoanIds={selectedLoanIds}
                disabled={disabled || loadingOfficer}
                onToggleLoan={toggleLoan}
              />
              <LoanOwnerSection
                title="Groups"
                owners={accountSummary.groups}
                selectedLoanIds={selectedLoanIds}
                disabled={disabled || loadingOfficer}
                onToggleLoan={toggleLoan}
              />
            </div>
            {fieldErrors.loans ? (
              <p className="text-sm text-destructive">{fieldErrors.loans}</p>
            ) : null}
          </div>
        ) : null}

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

        <Can permission="BULKREASSIGN_LOAN">
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={disabled || loadingOffice || loadingOfficer}>
              Submit
            </Button>
            <Link href="/organization" className={cn(buttonVariants({ variant: 'outline' }))}>
              Cancel
            </Link>
          </div>
        </Can>
      </form>
    </ListPage>
  );
}
