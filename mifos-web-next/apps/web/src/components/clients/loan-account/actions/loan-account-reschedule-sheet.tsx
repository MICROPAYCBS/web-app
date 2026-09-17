'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, LOAN_RESCHEDULE_CHANGE_REQUIRED_MESSAGE } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import {
  createLoanRescheduleRequestAction,
  loadLoanRescheduleTemplateAction
} from '@/actions/loan-reschedule';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import {
  unpaidLoanRescheduleInstallments
} from '@/lib/fineract/loan-reschedule-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';

const CREATE_TOAST = {
  completed: 'Reschedule request submitted.',
  pending: 'Reschedule request submitted for approval.'
};

export function LoanAccountRescheduleSheet({
  clientId,
  account,
  open,
  onOpenChange
}: {
  clientId: string;
  account: FineractLoanAccountDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const initialSubmittedOnDate = useInitialTransactionDate();
  const [rescheduleFromDate, setRescheduleFromDate] = useState('');
  const [rescheduleReasonId, setRescheduleReasonId] = useState('');
  const [submittedOnDate, setSubmittedOnDate] = useState(initialSubmittedOnDate);
  const [comments, setComments] = useState('');
  const [changeRepaymentDate, setChangeRepaymentDate] = useState(false);
  const [adjustedDueDate, setAdjustedDueDate] = useState('');
  const [introduceGrace, setIntroduceGrace] = useState(false);
  const [graceOnPrincipal, setGraceOnPrincipal] = useState('');
  const [graceOnInterest, setGraceOnInterest] = useState('');
  const [extendPeriod, setExtendPeriod] = useState(false);
  const [extraTerms, setExtraTerms] = useState('');
  const [adjustRate, setAdjustRate] = useState(false);
  const [newInterestRate, setNewInterestRate] = useState('');
  const [reasons, setReasons] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const installments = useMemo(() => unpaidLoanRescheduleInstallments(account), [account]);
  const installmentOptions = useMemo(
    () =>
      installments.map((installment) => ({
        value: installment.dueDate,
        label: installment.label,
        description: installment.description
      })),
    [installments]
  );
  const reasonOptions = useMemo(
    () => reasons.map((reason) => ({ value: String(reason.id), label: reason.name })),
    [reasons]
  );
  const adjustedFromDate = fineractDateToDate(rescheduleFromDate) ?? undefined;

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setRescheduleFromDate('');
    setRescheduleReasonId('');
    setSubmittedOnDate(initialSubmittedOnDate);
    setComments('');
    setChangeRepaymentDate(false);
    setAdjustedDueDate('');
    setIntroduceGrace(false);
    setGraceOnPrincipal('');
    setGraceOnInterest('');
    setExtendPeriod(false);
    setExtraTerms('');
    setAdjustRate(false);
    setNewInterestRate('');
    void loadLoanRescheduleTemplateAction().then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setReasons([]);
        return;
      }
      setReasons(result.reasons);
    });
    return () => {
      cancelled = true;
    };
  }, [account.id, initialSubmittedOnDate, open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createLoanRescheduleRequestAction(clientId, String(account.id), {
        rescheduleFromDate,
        rescheduleReasonId,
        submittedOnDate,
        rescheduleReasonComment: comments.trim() || undefined,
        adjustedDueDate: changeRepaymentDate ? adjustedDueDate : undefined,
        graceOnPrincipal: introduceGrace ? graceOnPrincipal : undefined,
        graceOnInterest: introduceGrace ? graceOnInterest : undefined,
        extraTerms: extendPeriod ? extraTerms : undefined,
        newInterestRate: adjustRate ? newInterestRate : undefined
      });

      if (!toastCommandOutcome(result, CREATE_TOAST)) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Reschedule loan"
      description="Request a new repayment schedule from an unpaid installment."
      formId={formId}
      submitLabel="Submit request"
      submitLoading={pending || loading}
      submitDisabled={loading || installments.length === 0}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reschedule options…</p>
        ) : null}
        {installments.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">
            There are no unpaid installments to reschedule from.
          </p>
        ) : null}
        <SelectField
          id={`${formId}-from`}
          label="Reschedule from installment"
          required
          value={rescheduleFromDate || undefined}
          onValueChange={(value) => setRescheduleFromDate(value ?? '')}
          options={installmentOptions}
          placeholder="Select an unpaid installment"
          error={fieldErrors.rescheduleFromDate}
        />
        <SelectField
          id={`${formId}-reason`}
          label="Reason"
          required
          value={rescheduleReasonId || undefined}
          onValueChange={(value) => setRescheduleReasonId(value ?? '')}
          options={reasonOptions}
          placeholder="Select a reason"
          error={fieldErrors.rescheduleReasonId}
        />
        <TransactionDateField
          id={`${formId}-submitted`}
          label="Submitted on"
          required
          value={submittedOnDate}
          onChange={setSubmittedOnDate}
          error={fieldErrors.submittedOnDate}
        />
        <TextField
          id={`${formId}-comments`}
          label="Comments"
          optional
          multiline
          value={comments}
          onChange={setComments}
          error={fieldErrors.rescheduleReasonComment}
          maxLength={500}
        />

        <Field orientation="horizontal">
          <Checkbox
            id={`${formId}-change-date`}
            checked={changeRepaymentDate}
            onCheckedChange={(checked) => setChangeRepaymentDate(checked === true)}
          />
          <FieldLabel htmlFor={`${formId}-change-date`}>Change repayment date</FieldLabel>
        </Field>
        {changeRepaymentDate ? (
          <DateField
            id={`${formId}-adjusted`}
            label="Installment rescheduled to"
            required
            allowFuture
            fromDate={adjustedFromDate}
            value={adjustedDueDate}
            onChange={(value) => setAdjustedDueDate(value ?? '')}
            error={fieldErrors.adjustedDueDate}
            hint="Must be on or after the selected installment date."
          />
        ) : null}

        <Field orientation="horizontal">
          <Checkbox
            id={`${formId}-grace`}
            checked={introduceGrace}
            onCheckedChange={(checked) => setIntroduceGrace(checked === true)}
          />
          <FieldLabel htmlFor={`${formId}-grace`}>Introduce mid-term grace periods</FieldLabel>
        </Field>
        {introduceGrace ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumericField
              id={`${formId}-grace-principal`}
              label="Principal grace periods"
              integer
              value={graceOnPrincipal}
              onChange={setGraceOnPrincipal}
              error={fieldErrors.graceOnPrincipal}
            />
            <NumericField
              id={`${formId}-grace-interest`}
              label="Interest grace periods"
              integer
              value={graceOnInterest}
              onChange={setGraceOnInterest}
              error={fieldErrors.graceOnInterest}
            />
          </div>
        ) : null}

        <Field orientation="horizontal">
          <Checkbox
            id={`${formId}-extend`}
            checked={extendPeriod}
            onCheckedChange={(checked) => setExtendPeriod(checked === true)}
          />
          <FieldLabel htmlFor={`${formId}-extend`}>Extend repayment period</FieldLabel>
        </Field>
        {extendPeriod ? (
          <NumericField
            id={`${formId}-extra`}
            label="Number of new repayments"
            integer
            required
            value={extraTerms}
            onChange={setExtraTerms}
            error={fieldErrors.extraTerms}
          />
        ) : null}

        <Field orientation="horizontal">
          <Checkbox
            id={`${formId}-rate`}
            checked={adjustRate}
            onCheckedChange={(checked) => setAdjustRate(checked === true)}
          />
          <FieldLabel htmlFor={`${formId}-rate`}>
            Adjust interest rate for the remainder of the loan
          </FieldLabel>
        </Field>
        {adjustRate ? (
          <NumericField
            id={`${formId}-new-rate`}
            label="New interest rate"
            required
            value={newInterestRate}
            onChange={setNewInterestRate}
            error={fieldErrors.newInterestRate}
          />
        ) : null}

        {fieldErrors.adjustedDueDate && !changeRepaymentDate ? (
          <p className="text-sm text-destructive">
            {fieldErrors.adjustedDueDate === LOAN_RESCHEDULE_CHANGE_REQUIRED_MESSAGE
              ? LOAN_RESCHEDULE_CHANGE_REQUIRED_MESSAGE
              : fieldErrors.adjustedDueDate}
          </p>
        ) : null}
      </form>
    </FormSheet>
  );
}
