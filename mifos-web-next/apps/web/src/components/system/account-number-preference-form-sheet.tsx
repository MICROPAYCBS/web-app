'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountNumberPreferenceDetail,
  FineractAccountNumberPreferenceTemplate
} from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateCreateAccountNumberPreference,
  validateUpdateAccountNumberPreference
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createAccountNumberPreferenceAction,
  updateAccountNumberPreferenceAction
} from '@/actions/account-number-preferences';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import {
  accountNumberPreferenceLabel,
  findAccountTypeOption,
  listPrefixTypeOptions
} from '@/lib/fineract/account-number-preference-display';

export function AccountNumberPreferenceFormSheet({
  mode,
  open,
  onOpenChange,
  template,
  preference
}: {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractAccountNumberPreferenceTemplate;
  preference?: FineractAccountNumberPreferenceDetail;
}) {
  const router = useRouter();
  const formId = useId();
  const [accountTypeId, setAccountTypeId] = useState<string | undefined>();
  const [prefixTypeId, setPrefixTypeId] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedAccountType = useMemo(
    () => findAccountTypeOption(template, Number(accountTypeId)),
    [accountTypeId, template]
  );

  const prefixTypeOptions = useMemo(() => {
    if (mode === 'edit' && preference) {
      return listPrefixTypeOptions(template, preference.accountType);
    }
    return listPrefixTypeOptions(template, selectedAccountType);
  }, [mode, preference, selectedAccountType, template]);

  const accountTypeOptions = useMemo(
    () =>
      template.accountTypeOptions.map((option) => ({
        value: String(option.id),
        label: accountNumberPreferenceLabel(option)
      })),
    [template.accountTypeOptions]
  );

  const prefixSelectOptions = useMemo(
    () =>
      prefixTypeOptions.map((option) => ({
        value: String(option.id),
        label: accountNumberPreferenceLabel(option)
      })),
    [prefixTypeOptions]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    if (mode === 'edit' && preference) {
      setAccountTypeId(String(preference.accountType.id));
      setPrefixTypeId(
        preference.prefixType?.id != null ? String(preference.prefixType.id) : undefined
      );
      return;
    }
    setAccountTypeId(undefined);
    setPrefixTypeId(undefined);
  }, [mode, open, preference]);

  useEffect(() => {
    if (mode === 'create') {
      setPrefixTypeId(undefined);
    }
  }, [accountTypeId, mode]);

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    if (pending) {
      return;
    }

    setSubmitError(null);
    const prefixType = prefixTypeId ? Number(prefixTypeId) : undefined;

    if (mode === 'create') {
      const parsed = validateCreateAccountNumberPreference({
        accountType: Number(accountTypeId),
        prefixType
      });
      if (!parsed.success) {
        const nextErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? 'form');
          nextErrors[key] = issue.message;
        }
        setFieldErrors(nextErrors);
        setSubmitError('Fix the highlighted fields.');
        return;
      }

      startTransition(async () => {
        const result = await createAccountNumberPreferenceAction(parsed.data);
        if (!result.ok) {
          setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          return;
        }

        toast.success('Account number preference created.');
        handleOpenChange(false);
        if (result.resourceId != null) {
          router.push(`/system/account-number-preferences/${result.resourceId}`);
        } else {
          router.refresh();
        }
      });
      return;
    }

    if (!preference) {
      return;
    }

    const parsed = validateUpdateAccountNumberPreference({ prefixType });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result = await updateAccountNumberPreferenceAction(preference.id, parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Account number preference updated.');
      handleOpenChange(false);
      router.refresh();
    });
  }

  const submitDisabled = mode === 'create' ? !accountTypeId : false;

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create preference' : 'Edit preference'}
      description={
        mode === 'create'
          ? 'Choose the account type and optional prefix field for generated account numbers.'
          : 'Update the prefix field used when account numbers are generated.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create preference' : 'Save changes'}
      onSubmit={handleSubmit}
      submitLoading={pending}
      submitDisabled={submitDisabled}
      className="data-[side=right]:sm:max-w-md"
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <SelectField
          label="Account type"
          required
          value={accountTypeId}
          onValueChange={setAccountTypeId}
          options={accountTypeOptions}
          disabled={pending || mode === 'edit'}
          error={fieldErrors.accountType}
          placeholder="Select account type"
        />
        <SelectField
          label="Prefix field"
          optional
          value={prefixTypeId}
          onValueChange={setPrefixTypeId}
          options={prefixSelectOptions}
          disabled={pending || (mode === 'create' && !accountTypeId)}
          error={fieldErrors.prefixType}
          placeholder="No prefix"
          emptyMessage={
            accountTypeId || mode === 'edit'
              ? 'No prefix options for this account type.'
              : 'Select an account type first.'
          }
        />
        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </form>
    </FormSheet>
  );
}
