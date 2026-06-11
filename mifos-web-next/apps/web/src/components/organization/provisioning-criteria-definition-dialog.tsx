'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProvisioningCriteriaGlAccount } from '@mifos/api-client';
import type { ProvisioningCriteriaDefinitionInput } from '@mifos/validation';
import { useEffect, useId, useMemo, useState } from 'react';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  filterProvisioningGlAccounts,
  provisioningGlAccountLabel
} from '@/lib/fineract/provisioning-criteria-display';

type DefinitionDraft = Partial<ProvisioningCriteriaDefinitionInput> & {
  categoryId: number;
  categoryName: string;
};

function toFormState(definition: DefinitionDraft) {
  return {
    minAge: definition.minAge != null ? String(definition.minAge) : '',
    maxAge: definition.maxAge != null ? String(definition.maxAge) : '',
    provisioningPercentage:
      definition.provisioningPercentage != null
        ? String(definition.provisioningPercentage)
        : '',
    liabilityAccount:
      definition.liabilityAccount != null ? String(definition.liabilityAccount) : undefined,
    expenseAccount:
      definition.expenseAccount != null ? String(definition.expenseAccount) : undefined
  };
}

export function ProvisioningCriteriaDefinitionDialog({
  open,
  onOpenChange,
  definition,
  glAccounts,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition: DefinitionDraft | null;
  glAccounts: ProvisioningCriteriaGlAccount[];
  onConfirm: (value: ProvisioningCriteriaDefinitionInput) => void;
}) {
  const formId = useId();
  const [form, setForm] = useState(() => toFormState(definition ?? { categoryId: 0, categoryName: '' }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && definition) {
      setForm(toFormState(definition));
      setFieldErrors({});
    }
  }, [open, definition]);

  const liabilityOptions = useMemo(() => {
    return filterProvisioningGlAccounts(glAccounts, 'LIABILITY').map((account) => ({
      value: String(account.id),
      label: provisioningGlAccountLabel(account)
    }));
  }, [glAccounts]);

  const expenseOptions = useMemo(() => {
    return filterProvisioningGlAccounts(glAccounts, 'EXPENSE').map((account) => ({
      value: String(account.id),
      label: provisioningGlAccountLabel(account)
    }));
  }, [glAccounts]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!definition) {
      return;
    }

    const nextErrors: Record<string, string> = {};
    const minAge = Number(form.minAge);
    const maxAge = Number(form.maxAge);
    const provisioningPercentage = Number(form.provisioningPercentage);
    const liabilityAccount = Number(form.liabilityAccount);
    const expenseAccount = Number(form.expenseAccount);

    if (!form.minAge.trim() || !Number.isFinite(minAge) || minAge < 0) {
      nextErrors.minAge = 'Min age is required';
    }
    if (!form.maxAge.trim() || !Number.isFinite(maxAge) || maxAge < 0) {
      nextErrors.maxAge = 'Max age is required';
    }
    if (
      !form.provisioningPercentage.trim() ||
      !Number.isFinite(provisioningPercentage) ||
      provisioningPercentage < 0
    ) {
      nextErrors.provisioningPercentage = 'Percentage is required';
    }
    if (!form.liabilityAccount || !Number.isFinite(liabilityAccount)) {
      nextErrors.liabilityAccount = 'Liability account is required';
    }
    if (!form.expenseAccount || !Number.isFinite(expenseAccount)) {
      nextErrors.expenseAccount = 'Expense account is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    onConfirm({
      categoryId: definition.categoryId,
      categoryName: definition.categoryName,
      minAge,
      maxAge,
      provisioningPercentage,
      liabilityAccount,
      expenseAccount
    });
    onOpenChange(false);
  }

  const canSubmit =
    form.minAge.trim().length > 0 &&
    form.maxAge.trim().length > 0 &&
    form.provisioningPercentage.trim().length > 0 &&
    Boolean(form.liabilityAccount) &&
    Boolean(form.expenseAccount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit criteria definition</DialogTitle>
          <DialogDescription>
            {definition?.categoryName
              ? `Configure age bands and GL accounts for ${definition.categoryName}.`
              : 'Configure provisioning definition values.'}
          </DialogDescription>
        </DialogHeader>
        <form id={formId} className="grid gap-4" onSubmit={handleSubmit}>
          <NumericField
            id={`${formId}-minAge`}
            label="Min age"
            required
            integer
            value={form.minAge}
            onChange={(value) => setForm((prev) => ({ ...prev, minAge: value }))}
            error={fieldErrors.minAge}
          />
          <NumericField
            id={`${formId}-maxAge`}
            label="Max age"
            required
            integer
            value={form.maxAge}
            onChange={(value) => setForm((prev) => ({ ...prev, maxAge: value }))}
            error={fieldErrors.maxAge}
          />
          <NumericField
            id={`${formId}-provisioningPercentage`}
            label="Percentage (%)"
            required
            value={form.provisioningPercentage}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, provisioningPercentage: value }))
            }
            error={fieldErrors.provisioningPercentage}
          />
          <SelectField
            id={`${formId}-liabilityAccount`}
            label="Liability account"
            required
            value={form.liabilityAccount}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, liabilityAccount: value }))
            }
            options={liabilityOptions}
            placeholder="Select liability account"
            error={fieldErrors.liabilityAccount}
          />
          <SelectField
            id={`${formId}-expenseAccount`}
            label="Expense account"
            required
            value={form.expenseAccount}
            onValueChange={(value) => setForm((prev) => ({ ...prev, expenseAccount: value }))}
            options={expenseOptions}
            placeholder="Select expense account"
            error={fieldErrors.expenseAccount}
          />
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={!canSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
