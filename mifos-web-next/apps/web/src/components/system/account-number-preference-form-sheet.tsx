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
import { defaultPatternForAccountType, sequenceScopeAllowedForAccountType } from '@mifos/domain';
import {
  formatActionErrorMessage,
  validateCreateAccountNumberPreference,
  validateUpdateAccountNumberPreference
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import {
  createAccountNumberPreferenceAction,
  updateAccountNumberPreferenceAction
} from '@/actions/account-number-preferences';
import {
  AccountNumberFormatStructuredFields,
  type AccountNumberFormatOfficeOption
} from '@/components/system/account-number-format-structured-fields';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
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
  preference,
  structuredFormatsEnabled,
  officeOptions = []
}: {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractAccountNumberPreferenceTemplate;
  preference?: FineractAccountNumberPreferenceDetail;
  structuredFormatsEnabled: boolean;
  officeOptions?: AccountNumberFormatOfficeOption[];
}) {
  const router = useRouter();
  const formId = useId();
  const [accountTypeId, setAccountTypeId] = useState<string | undefined>();
  const [prefixTypeId, setPrefixTypeId] = useState<string | undefined>();
  const [prefixCharacter, setPrefixCharacter] = useState('');
  const [structuredEnabled, setStructuredEnabled] = useState(false);
  const [formatPattern, setFormatPattern] = useState('');
  const [sequenceScope, setSequenceScope] = useState<string | undefined>();
  const [checkDigitAlgorithm, setCheckDigitAlgorithm] = useState<string | undefined>();
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

  const showStructuredFields = structuredFormatsEnabled && structuredEnabled;
  const showLegacyFields = !structuredFormatsEnabled || !structuredEnabled;

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
      setPrefixCharacter(preference.prefixCharacter ?? '');
      setStructuredEnabled(preference.structuredEnabled === true);
      setFormatPattern(preference.formatPattern ?? '');
      setSequenceScope(
        preference.sequenceScope?.id != null ? String(preference.sequenceScope.id) : undefined
      );
      setCheckDigitAlgorithm(
        preference.checkDigitAlgorithm?.id != null
          ? String(preference.checkDigitAlgorithm.id)
          : undefined
      );
      return;
    }
    setAccountTypeId(undefined);
    setPrefixTypeId(undefined);
    setPrefixCharacter('');
    setStructuredEnabled(false);
    setFormatPattern('');
    setSequenceScope(undefined);
    setCheckDigitAlgorithm(undefined);
  }, [mode, open, preference]);

  useEffect(() => {
    if (mode === 'create') {
      setPrefixTypeId(undefined);
    }
  }, [accountTypeId, mode]);

  useEffect(() => {
    if (!structuredEnabled || mode !== 'create' || !Number.isFinite(Number(accountTypeId))) {
      return;
    }
    const defaults = defaultPatternForAccountType(Number(accountTypeId));
    if (!defaults) {
      return;
    }
    setFormatPattern(defaults.formatPattern);
    setSequenceScope(String(defaults.sequenceScope));
    setCheckDigitAlgorithm(String(defaults.checkDigitAlgorithm));
  }, [accountTypeId, mode, structuredEnabled]);

  useEffect(() => {
    if (!structuredEnabled || !Number.isFinite(Number(accountTypeId)) || !sequenceScope) {
      return;
    }
    if (!sequenceScopeAllowedForAccountType(Number(accountTypeId), Number(sequenceScope))) {
      setSequenceScope(undefined);
    }
  }, [accountTypeId, sequenceScope, structuredEnabled]);

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    onOpenChange(next);
  }

  function buildStructuredPayload() {
    if (!structuredFormatsEnabled) {
      return {};
    }
    return {
      structuredEnabled,
      formatPattern: structuredEnabled ? formatPattern.trim() : undefined,
      sequenceScope: structuredEnabled && sequenceScope ? Number(sequenceScope) : undefined,
      checkDigitAlgorithm:
        structuredEnabled && checkDigitAlgorithm ? Number(checkDigitAlgorithm) : undefined
    };
  }

  function handleSubmit() {
    if (pending) {
      return;
    }

    setSubmitError(null);
    const prefixType = prefixTypeId ? Number(prefixTypeId) : undefined;
    const structuredPayload = buildStructuredPayload();

    if (mode === 'create') {
      const parsed = validateCreateAccountNumberPreference({
        accountType: Number(accountTypeId),
        prefixType: showLegacyFields ? prefixType : undefined,
        prefixCharacter: showLegacyFields && prefixCharacter.trim() ? prefixCharacter.trim() : null,
        ...structuredPayload
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
        toastCommandOutcome(result, {
          completed: 'Account number preference created.',
          pending: 'Account number preference created sent for approval.'
        });
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

    const parsed = validateUpdateAccountNumberPreference({
      prefixType: showLegacyFields ? prefixType : undefined,
      prefixCharacter: showLegacyFields && prefixCharacter.trim() ? prefixCharacter.trim() : null,
      ...structuredPayload
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
      const result = await updateAccountNumberPreferenceAction(preference.id, parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Account number preference updated.',
        pending: 'Account number preference updated sent for approval.'
      });
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
          ? 'Choose the account type and configure how account numbers are generated.'
          : 'Update how account numbers are generated for this account type.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create preference' : 'Save changes'}
      onSubmit={handleSubmit}
      submitLoading={pending}
      submitDisabled={submitDisabled}
      className="data-[side=right]:sm:max-w-xl"
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

        {structuredFormatsEnabled ? (
          <SwitchField
            id={`${formId}-structured-enabled`}
            label="Structured format"
            description="Use multi-segment patterns instead of legacy prefix fields."
            checked={structuredEnabled}
            onCheckedChange={setStructuredEnabled}
            disabled={pending}
          />
        ) : null}

        {showLegacyFields ? (
          <>
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
            <TextField
              label="Prefix character"
              optional
              value={prefixCharacter}
              onChange={setPrefixCharacter}
              disabled={pending}
              error={fieldErrors.prefixCharacter}
              placeholder="Single character override"
            />
          </>
        ) : null}

        {showStructuredFields ? (
          <AccountNumberFormatStructuredFields
            accountTypeId={Number(accountTypeId)}
            template={template}
            values={{ formatPattern, sequenceScope, checkDigitAlgorithm }}
            onChange={(patch) => {
              if (patch.formatPattern != null) {
                setFormatPattern(patch.formatPattern);
              }
              if (patch.sequenceScope !== undefined) {
                setSequenceScope(patch.sequenceScope);
              }
              if (patch.checkDigitAlgorithm !== undefined) {
                setCheckDigitAlgorithm(patch.checkDigitAlgorithm);
              }
            }}
            officeOptions={officeOptions}
            fieldErrors={fieldErrors}
            disabled={pending}
          />
        ) : null}

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      </form>
    </FormSheet>
  );
}
