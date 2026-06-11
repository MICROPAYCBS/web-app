'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ProvisioningCriteriaGlAccount,
  ProvisioningCriteriaLoanProduct
} from '@mifos/api-client';
import {
  isProvisioningDefinitionComplete,
  type ProvisioningCriteriaDefinitionInput
} from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  createProvisioningCriteriaAction,
  updateProvisioningCriteriaAction
} from '@/actions/provisioning-criteria';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { TextField } from '@/components/composites/text-field';
import { ProvisioningCriteriaDefinitionsEditor } from '@/components/organization/provisioning-criteria-definitions-editor';
import { ProvisioningCriteriaLoanProductsField } from '@/components/organization/provisioning-criteria-loan-products-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import { mergeProvisioningLoanProductOptions } from '@/lib/fineract/provisioning-criteria-display';
import {
  provisioningCriteriaDetailPath,
  PROVISIONING_CRITERIA_LIST_PATH
} from '@/lib/fineract/provisioning-criteria-paths';
import { cn } from '@/lib/utils';

type DefinitionDraft = Partial<ProvisioningCriteriaDefinitionInput> & {
  categoryId: number;
  categoryName: string;
};

export function ProvisioningCriteriaFormPage({
  mode,
  criteriaId,
  initialCriteriaName = '',
  initialLoanProducts = [],
  initialDefinitions = [],
  loanProductOptions,
  glAccounts
}: {
  mode: 'create' | 'edit';
  criteriaId?: number;
  initialCriteriaName?: string;
  initialLoanProducts?: ProvisioningCriteriaLoanProduct[];
  initialDefinitions?: DefinitionDraft[];
  loanProductOptions: ProvisioningCriteriaLoanProduct[];
  glAccounts: ProvisioningCriteriaGlAccount[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [criteriaName, setCriteriaName] = useState(initialCriteriaName);
  const [loanProducts, setLoanProducts] = useState<ProvisioningCriteriaLoanProduct[]>(
    initialLoanProducts
  );
  const [definitions, setDefinitions] = useState<DefinitionDraft[]>(initialDefinitions);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const productOptions = useMemo(
    () => mergeProvisioningLoanProductOptions(loanProductOptions, initialLoanProducts),
    [loanProductOptions, initialLoanProducts]
  );

  const allDefinitionsComplete = useMemo(
    () => definitions.every((definition) => isProvisioningDefinitionComplete(definition)),
    [definitions]
  );

  const canSubmit =
    criteriaName.trim().length > 0 &&
    loanProducts.length > 0 &&
    (mode === 'edit' ? true : allDefinitionsComplete);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    if (mode === 'create' && !allDefinitionsComplete) {
      setSubmitError('Please fill all provisioning criteria definitions.');
      return;
    }

    const completeDefinitions = definitions.filter((definition) =>
      isProvisioningDefinitionComplete(definition)
    ) as ProvisioningCriteriaDefinitionInput[];

    const payload = {
      criteriaName: criteriaName.trim(),
      loanProducts,
      definitions: completeDefinitions,
      locale: FINERACT_LOCALE
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createProvisioningCriteriaAction(payload)
          : await updateProvisioningCriteriaAction(String(criteriaId), payload);

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      if (mode === 'create' && result.criteriaId != null) {
        router.push(provisioningCriteriaDetailPath(result.criteriaId));
      } else if (criteriaId != null) {
        router.push(provisioningCriteriaDetailPath(criteriaId));
      } else {
        router.push(PROVISIONING_CRITERIA_LIST_PATH);
      }
      router.refresh();
    });
  }

  return (
    <ListPage
      title={mode === 'create' ? 'Create provisioning criteria' : 'Edit provisioning criteria'}
      description="Define loan loss provisioning rules by category, age band, and GL accounts."
      backLink={
        <DetailBackLink
          href={
            mode === 'edit' && criteriaId != null
              ? provisioningCriteriaDetailPath(criteriaId)
              : PROVISIONING_CRITERIA_LIST_PATH
          }
          label={
            mode === 'edit' ? 'Back to provisioning criteria' : 'Back to provisioning criteria list'
          }
        />
      }
    >
      <form className="mx-auto max-w-5xl space-y-6" onSubmit={handleSubmit}>
        {submitError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
        <TextField
          id="criteriaName"
          label="Name"
          required
          value={criteriaName}
          onChange={setCriteriaName}
          error={fieldErrors.criteriaName}
        />
        <ProvisioningCriteriaLoanProductsField
          options={productOptions}
          value={loanProducts}
          onChange={setLoanProducts}
          error={fieldErrors.loanProducts}
          disabled={pending}
        />
        <ProvisioningCriteriaDefinitionsEditor
          definitions={definitions}
          glAccounts={glAccounts}
          onChange={setDefinitions}
          requireAllComplete={mode === 'create'}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSubmit || pending}>
            {mode === 'create' ? 'Create provisioning criteria' : 'Save changes'}
          </Button>
          <Link
            href={
              mode === 'edit' && criteriaId != null
                ? provisioningCriteriaDetailPath(criteriaId)
                : PROVISIONING_CRITERIA_LIST_PATH
            }
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancel
          </Link>
        </div>
      </form>
    </ListPage>
  );
}
