'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createDepartmentAction, updateDepartmentAction } from '@/actions/department';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import type { Department, DepartmentTemplate } from '@/lib/fineract/departments';

type DepartmentFormState = {
  departmentCode: string;
  departmentName: string;
  officeId: string;
  active: string;
};

function defaultFormState(): DepartmentFormState {
  return {
    departmentCode: '',
    departmentName: '',
    officeId: '',
    active: 'true'
  };
}

function formStateFromDepartment(department: Department): DepartmentFormState {
  return {
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    officeId: department.officeId != null ? String(department.officeId) : '',
    active: department.active === false ? 'false' : 'true'
  };
}

export function DepartmentFormSheet({
  open,
  onOpenChange,
  mode,
  template,
  department
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  template: DepartmentTemplate;
  department?: Department;
}) {
  const router = useRouter();
  const [form, setForm] = useState(defaultFormState());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(
      mode === 'edit' && department ? formStateFromDepartment(department) : defaultFormState()
    );
    setFieldErrors({});
    setFormError(null);
  }, [open, mode, department]);

  function updateField<K extends keyof DepartmentFormState>(key: K, value: DepartmentFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    setFormError(null);
    setFieldErrors({});

    const payload = {
      departmentCode: form.departmentCode.trim(),
      departmentName: form.departmentName.trim(),
      officeId: form.officeId ? Number(form.officeId) : undefined,
      active: form.active === 'true'
    };

    const validationErrors: Record<string, string> = {};
    if (!payload.departmentCode) {
      validationErrors.departmentCode = 'Department code is required.';
    }
    if (!payload.departmentName) {
      validationErrors.departmentName = 'Department name is required.';
    }
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createDepartmentAction(payload)
          : await updateDepartmentAction(department!.id, payload);

      if (!result.ok) {
        setFormError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      toast.success(mode === 'create' ? 'Department created.' : 'Department updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  const officeOptions = template.officeOptions.map((office) => ({
    value: String(office.id),
    label: office.name ?? office.nameDecorated ?? String(office.id)
  }));

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create department' : 'Edit department'}
      description="Internal cost units within branches for departmental P&amp;L reporting."
      submitLabel={mode === 'create' ? 'Create department' : 'Save changes'}
      submitLoading={pending}
      onSubmit={submit}
    >
      <div className="space-y-4">
        {formError ? <FormErrorAlert>{formError}</FormErrorAlert> : null}
        <TextField
          label="Department code"
          value={form.departmentCode}
          onChange={(value) => updateField('departmentCode', value)}
          error={fieldErrors.departmentCode}
          required
        />
        <TextField
          label="Department name"
          value={form.departmentName}
          onChange={(value) => updateField('departmentName', value)}
          error={fieldErrors.departmentName}
          required
        />
        <SelectField
          label="Branch"
          value={form.officeId || undefined}
          onValueChange={(value) => updateField('officeId', value ?? '')}
          options={officeOptions}
          placeholder="All branches"
          optional
        />
        <SelectField
          label="Status"
          value={form.active}
          onValueChange={(value) => updateField('active', value ?? 'true')}
          options={
            template.activeOptions.length > 0
              ? template.activeOptions
              : [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' }
                ]
          }
        />
      </div>
    </FormSheet>
  );
}
