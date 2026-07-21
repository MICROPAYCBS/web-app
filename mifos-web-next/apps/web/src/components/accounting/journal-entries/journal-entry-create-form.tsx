'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  FineractJournalEntryGlAccountOption,
  FineractOfficeOption,
  FineractPaymentTypeOption
} from '@mifos/api-client';
import { areJournalEntryTotalsBalanced } from '@mifos/domain';
import {
  formatActionErrorMessage,
  isInterBranchJournalEntry,
  validateCreateJournalEntryForm,
  type CreateJournalEntryFormInput,
  type CreateJournalEntryValidationContext
} from '@mifos/validation';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createJournalEntryAction } from '@/actions/journal-entries';
import { JournalEntryLinesEditor } from '@/components/accounting/journal-entries/journal-entry-lines-editor';
import { validateJournalEntryForm } from '@/components/accounting/journal-entries/journal-entry-form-validation';
import { JournalEntryTotalsSummary } from '@/components/accounting/journal-entry-totals-summary';
import { DetailSection } from '@/components/composites';
import { FineractErrorAlert } from '@/components/composites/fineract-error-alert';
import { FormPageFooter } from '@/components/composites/form-page-footer';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDepartmentsForOffice } from '@/hooks/use-departments-for-office';
import { CENTRAL_BRANCH_CLEARING_NOT_CONFIGURED_MESSAGE } from '@/lib/accounting/inter-branch-recon';
import { journalEntriesListPathWithOpenTransaction } from '@/lib/accounting/journal-entry-links';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { currencySelectOptions } from '@/lib/accounting/journal-entry-display';
import { departmentSelectOptions } from '@/lib/fineract/department-select-options';

const JOURNAL_ENTRIES_LIST_PATH = '/accounting/journal-entries';

const ADVANCED_FIELD_KEYS = new Set([
  'referenceNumber',
  'paymentTypeId',
  'accountNumber',
  'checkNumber',
  'routingCode',
  'receiptNumber',
  'bankNumber',
  'comments'
]);

function hasAdvancedFieldErrors(errors: Record<string, string>) {
  return Object.keys(errors).some((key) => ADVANCED_FIELD_KEYS.has(key));
}

function sideRequiresDepartment(
  lines: CreateJournalEntryFormInput['debits'],
  glAccountTypesById: Record<number, number>
) {
  return lines.some((line) => {
    const typeId = glAccountTypesById[line.glAccountId];
    return typeId === 4 || typeId === 5;
  });
}

export type JournalEntryCreateFormProps = {
  initialValues: CreateJournalEntryFormInput;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  paymentTypes: FineractPaymentTypeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  validationContext: CreateJournalEntryValidationContext;
  clearingConfigured?: boolean;
};

export function JournalEntryCreateForm({
  initialValues,
  offices,
  currencies,
  paymentTypes,
  glAccounts,
  validationContext,
  clearingConfigured = true
}: JournalEntryCreateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CreateJournalEntryFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mandatory' | 'advanced'>('mandatory');
  const [pending, startTransition] = useTransition();

  const isBalanced = useMemo(
    () => areJournalEntryTotalsBalanced(form.debits, form.credits),
    [form.debits, form.credits]
  );

  const isInterBranch = useMemo(
    () => isInterBranchJournalEntry(form),
    [form.debitOfficeId, form.creditOfficeId]
  );

  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: office.name ?? office.nameDecorated ?? String(office.id)
      })),
    [offices]
  );

  const debitOfficeId = form.debitOfficeId > 0 ? form.debitOfficeId : undefined;
  const creditOfficeId = form.creditOfficeId > 0 ? form.creditOfficeId : undefined;

  const { departments: debitDepartments, loading: debitDepartmentsLoading } =
    useDepartmentsForOffice(debitOfficeId);
  const { departments: creditDepartments, loading: creditDepartmentsLoading } =
    useDepartmentsForOffice(creditOfficeId);

  const debitDepartmentOptions = useMemo(
    () => departmentSelectOptions(debitDepartments),
    [debitDepartments]
  );
  const creditDepartmentOptions = useMemo(
    () => departmentSelectOptions(creditDepartments),
    [creditDepartments]
  );

  useEffect(() => {
    if (form.debitDepartmentId == null) {
      return;
    }
    if (
      debitOfficeId == null ||
      (!debitDepartmentsLoading &&
        !debitDepartments.some((department) => department.id === form.debitDepartmentId))
    ) {
      patchForm({ debitDepartmentId: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear stale dept when branch/options change
  }, [debitOfficeId, debitDepartments, debitDepartmentsLoading, form.debitDepartmentId]);

  useEffect(() => {
    if (form.creditDepartmentId == null) {
      return;
    }
    if (
      creditOfficeId == null ||
      (!creditDepartmentsLoading &&
        !creditDepartments.some((department) => department.id === form.creditDepartmentId))
    ) {
      patchForm({ creditDepartmentId: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear stale dept when branch/options change
  }, [creditOfficeId, creditDepartments, creditDepartmentsLoading, form.creditDepartmentId]);

  const glAccountTypesById = validationContext.glAccountTypesById ?? {};

  const debitDepartmentRequired = useMemo(() => {
    if (!validationContext.requireDepartmentOnPlLines) {
      return false;
    }
    return sideRequiresDepartment(form.debits, glAccountTypesById);
  }, [form.debits, glAccountTypesById, validationContext.requireDepartmentOnPlLines]);

  const creditDepartmentRequired = useMemo(() => {
    if (!validationContext.requireDepartmentOnPlLines) {
      return false;
    }
    return sideRequiresDepartment(form.credits, glAccountTypesById);
  }, [form.credits, glAccountTypesById, validationContext.requireDepartmentOnPlLines]);

  const paymentTypeOptions = useMemo(
    () =>
      paymentTypes.map((paymentType) => ({
        value: String(paymentType.id),
        label: paymentType.name
      })),
    [paymentTypes]
  );

  function patchForm(patch: Partial<CreateJournalEntryFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as CreateJournalEntryFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    const errors = validateJournalEntryForm(formRef.current, validationContext);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Fix the highlighted fields.');
      if (hasAdvancedFieldErrors(errors)) {
        setActiveTab('advanced');
      }
      return;
    }

    const parsed = validateCreateJournalEntryForm(formRef.current, validationContext);
    if (!parsed.success) {
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result = await createJournalEntryAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (hasAdvancedFieldErrors(result.fieldErrors)) {
            setActiveTab('advanced');
          }
        }
        toastFineractError(result.message);
        return;
      }
      if (result.transactionId) {
        // Open the sheet from the list page after navigation — starting the fetch on the
        // create page can leave loading stuck when the route transition aborts the action.
        router.push(journalEntriesListPathWithOpenTransaction(result.transactionId));
      } else {
        router.push(JOURNAL_ENTRIES_LIST_PATH);
        return;
      }
      toastCommandOutcome(result, {
        completed: result.interBranch
          ? 'Cross-branch journal entries created.'
          : 'Journal entry created.',
        pending: result.interBranch
          ? 'Cross-branch journal entries sent for approval.'
          : 'Journal entry created sent for approval.'
      });
      router.refresh();
    });
  }

  return (
    <form
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="space-y-6 p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'mandatory' | 'advanced')}
        >
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="mandatory" className="flex-1">
              Mandatory fields
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1">
              Advanced optional fields
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mandatory" className="mt-0 space-y-8">
            <DetailSection title="Posting details">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Currency"
                  required
                  value={form.currencyCode || undefined}
                  onValueChange={(value) => {
                    if (value) {
                      patchForm({ currencyCode: value });
                    }
                  }}
                  options={currencySelectOptions(currencies)}
                  placeholder="Select currency"
                  disabled={pending}
                  error={fieldErrors.currencyCode}
                />
                <TransactionDateField
                  label="Transaction date"
                  required
                  value={form.transactionDate}
                  onChange={(value) => patchForm({ transactionDate: value ?? '' })}
                  disabled={pending}
                  error={fieldErrors.transactionDate}
                />
              </div>
            </DetailSection>

            <DetailSection
              title="Journal lines"
              description="Enter debit and credit lines. Totals must balance before you can post."
            >
              {isInterBranch ? (
                <div
                  className="mb-4 flex items-start gap-3 rounded-md border border-border bg-muted/50 px-4 py-3"
                  role="status"
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <p className="text-sm text-muted-foreground">
                    Cross-branch posting — 2 journal entries will be created and cleared through
                    inter-branch reconciliation.
                  </p>
                </div>
              ) : null}

              {isInterBranch && !clearingConfigured ? (
                <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {CENTRAL_BRANCH_CLEARING_NOT_CONFIGURED_MESSAGE}
                </p>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Debit branch"
                      required
                      value={debitOfficeId != null ? String(debitOfficeId) : undefined}
                      onValueChange={(value) => {
                        if (!value) {
                          return;
                        }
                        patchForm({
                          debitOfficeId: Number(value),
                          debitDepartmentId: undefined
                        });
                      }}
                      options={officeOptions}
                      placeholder="Select branch"
                      disabled={pending}
                      error={fieldErrors.debitOfficeId}
                    />
                    <SelectField
                      label="Debit department"
                      optional={!debitDepartmentRequired}
                      required={debitDepartmentRequired}
                      value={
                        form.debitDepartmentId != null ? String(form.debitDepartmentId) : undefined
                      }
                      onValueChange={(value) =>
                        patchForm({ debitDepartmentId: value ? Number(value) : undefined })
                      }
                      options={debitDepartmentOptions}
                      placeholder={
                        debitOfficeId == null
                          ? 'Select branch first'
                          : debitDepartmentsLoading
                            ? 'Loading…'
                            : 'None'
                      }
                      disabled={pending || debitOfficeId == null || debitDepartmentsLoading}
                      error={fieldErrors.debitDepartmentId}
                    />
                  </div>
                  <JournalEntryLinesEditor
                    label="Debits"
                    lines={form.debits}
                    fieldPrefix="debits"
                    glAccounts={glAccounts}
                    currencyCode={form.currencyCode}
                    fieldErrors={fieldErrors}
                    pending={pending}
                    allowMultiple
                    onChange={(debits) => patchForm({ debits })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Credit branch"
                      required
                      value={creditOfficeId != null ? String(creditOfficeId) : undefined}
                      onValueChange={(value) => {
                        if (!value) {
                          return;
                        }
                        patchForm({
                          creditOfficeId: Number(value),
                          creditDepartmentId: undefined
                        });
                      }}
                      options={officeOptions}
                      placeholder="Select branch"
                      disabled={pending}
                      error={fieldErrors.creditOfficeId}
                    />
                    <SelectField
                      label="Credit department"
                      optional={!creditDepartmentRequired}
                      required={creditDepartmentRequired}
                      value={
                        form.creditDepartmentId != null
                          ? String(form.creditDepartmentId)
                          : undefined
                      }
                      onValueChange={(value) =>
                        patchForm({ creditDepartmentId: value ? Number(value) : undefined })
                      }
                      options={creditDepartmentOptions}
                      placeholder={
                        creditOfficeId == null
                          ? 'Select branch first'
                          : creditDepartmentsLoading
                            ? 'Loading…'
                            : 'None'
                      }
                      disabled={pending || creditOfficeId == null || creditDepartmentsLoading}
                      error={fieldErrors.creditDepartmentId}
                    />
                  </div>
                  <JournalEntryLinesEditor
                    label="Credits"
                    lines={form.credits}
                    fieldPrefix="credits"
                    glAccounts={glAccounts}
                    currencyCode={form.currencyCode}
                    fieldErrors={fieldErrors}
                    pending={pending}
                    allowMultiple
                    onChange={(credits) => patchForm({ credits })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <JournalEntryTotalsSummary
                  debits={form.debits}
                  credits={form.credits}
                  currencyCode={form.currencyCode}
                  error={fieldErrors.balance}
                />
              </div>
            </DetailSection>
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 space-y-8">
            <DetailSection title="Additional posting details" description="Optional">
              <TextField
                label="Reference number"
                optional
                value={form.referenceNumber ?? ''}
                onChange={(value) => patchForm({ referenceNumber: value })}
                disabled={pending}
                error={fieldErrors.referenceNumber}
              />
            </DetailSection>

            <DetailSection title="Payment details" description="Optional">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Payment type"
                  optional
                  value={form.paymentTypeId ? String(form.paymentTypeId) : undefined}
                  onValueChange={(value) =>
                    patchForm({ paymentTypeId: value ? Number(value) : undefined })
                  }
                  options={paymentTypeOptions}
                  placeholder="Select payment type"
                  disabled={pending}
                  error={fieldErrors.paymentTypeId}
                />
                <TextField
                  label="Account number"
                  optional
                  value={form.accountNumber ?? ''}
                  onChange={(value) => patchForm({ accountNumber: value })}
                  disabled={pending}
                />
                <TextField
                  label="Cheque number"
                  optional
                  value={form.checkNumber ?? ''}
                  onChange={(value) => patchForm({ checkNumber: value })}
                  disabled={pending}
                />
                <TextField
                  label="Routing code"
                  optional
                  value={form.routingCode ?? ''}
                  onChange={(value) => patchForm({ routingCode: value })}
                  disabled={pending}
                />
                <TextField
                  label="Receipt number"
                  optional
                  value={form.receiptNumber ?? ''}
                  onChange={(value) => patchForm({ receiptNumber: value })}
                  disabled={pending}
                />
                <TextField
                  label="Bank number"
                  optional
                  value={form.bankNumber ?? ''}
                  onChange={(value) => patchForm({ bankNumber: value })}
                  disabled={pending}
                />
              </div>
            </DetailSection>

            <TextField
              label="Comments"
              optional
              multiline
              rows={3}
              value={form.comments ?? ''}
              onChange={(value) => patchForm({ comments: value })}
              disabled={pending}
              error={fieldErrors.comments}
            />
          </TabsContent>
        </Tabs>

        {submitError ? (
          submitError === 'Fix the highlighted fields.' ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          ) : (
            <FineractErrorAlert message={submitError} />
          )
        ) : null}

        {!isBalanced ? (
          <p className="text-sm text-destructive">
            Debits and credits are not balanced. Adjust line amounts before posting.
          </p>
        ) : null}
      </div>

      <FormPageFooter
        cancelHref={JOURNAL_ENTRIES_LIST_PATH}
        submitLabel="Post entry"
        submitDisabled={!isBalanced || (isInterBranch && !clearingConfigured)}
        submitLoading={pending}
        submitLoadingLabel="Posting…"
      />
    </form>
  );
}
