'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEntityDatatableCheckTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import type { EntityDatatableCheckEntity } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { createEntityDatatableCheckAction } from '@/actions/entity-datatable-check';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import {
  datatableOptionsForEntity,
  ENTITY_CHECK_ENTITY_OPTIONS,
  entityRequiresProduct,
  productOptionsForEntity,
  statusOptionsForEntity
} from '@/lib/fineract/entity-datatable-check-display';

export function EntityDatatableCheckFormSheet({
  open,
  onOpenChange,
  template
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractEntityDatatableCheckTemplate;
}) {
  const router = useRouter();
  const formId = useId();
  const [pending, startTransition] = useTransition();
  const [entity, setEntity] = useState<EntityDatatableCheckEntity | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [datatableName, setDatatableName] = useState<string | undefined>();
  const [productId, setProductId] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => statusOptionsForEntity(template, entity),
    [template, entity]
  );
  const datatableOptions = useMemo(
    () => datatableOptionsForEntity(template, entity),
    [template, entity]
  );
  const productOptions = useMemo(
    () => productOptionsForEntity(template, entity),
    [template, entity]
  );
  const showProduct = entityRequiresProduct(entity);

  useEffect(() => {
    setStatus(undefined);
    setDatatableName(undefined);
    setProductId(undefined);
  }, [entity]);

  const canSubmit =
    Boolean(entity) &&
    Boolean(status) &&
    Boolean(datatableName) &&
    (!showProduct || Boolean(productId));

  function resetForm() {
    setEntity(undefined);
    setStatus(undefined);
    setDatatableName(undefined);
    setProductId(undefined);
    setFieldErrors({});
    setSubmitError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (pending) {
      return;
    }
    if (nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createEntityDatatableCheckAction({
        entity: entity ?? 'm_client',
        status: Number(status),
        datatableName: datatableName ?? '',
        productId: showProduct && productId ? Number(productId) : undefined
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      onOpenChange(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Create entity data table check"
      description="Link a data table to an entity status so the table must be completed before the status change."
      formId={formId}
      submitDisabled={!canSubmit}
      submitLoading={pending}
      submitLabel="Create"
      error={
        submitError ? (
          <FormErrorAlert>{formatActionErrorMessage(submitError, fieldErrors)}</FormErrorAlert>
        ) : null
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="Entity"
          required
          value={entity}
          onValueChange={(value) => setEntity(value as EntityDatatableCheckEntity)}
          options={ENTITY_CHECK_ENTITY_OPTIONS}
          error={fieldErrors.entity}
        />
        <SelectField
          label="Status"
          required
          value={status}
          onValueChange={setStatus}
          options={statusOptions}
          disabled={!entity}
          placeholder={entity ? 'Select status' : 'Select an entity first'}
          error={fieldErrors.status}
        />
        <SelectField
          label="Data table"
          required
          value={datatableName}
          onValueChange={setDatatableName}
          options={datatableOptions}
          disabled={!entity}
          placeholder={entity ? 'Select data table' : 'Select an entity first'}
          error={fieldErrors.datatableName}
        />
        {showProduct ? (
          <SelectField
            label="Product"
            required
            value={productId}
            onValueChange={setProductId}
            options={productOptions}
            placeholder="Select product"
            error={fieldErrors.productId}
          />
        ) : null}
      </form>
    </FormSheet>
  );
}
