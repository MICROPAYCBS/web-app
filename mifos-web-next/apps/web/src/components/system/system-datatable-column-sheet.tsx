'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SystemDatatableColumnType } from '@mifos/validation';
import { useEffect, useMemo, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import {
  COLUMN_TYPE_OPTIONS,
  type SystemDatatableColumnDraft,
  type SystemDatatableColumnKind
} from '@/lib/fineract/system-datatable-form';

export function SystemDatatableColumnSheet({
  open,
  onOpenChange,
  mode,
  column,
  codeOptions,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  column: SystemDatatableColumnDraft | null;
  codeOptions: { value: string; label: string }[];
  onSave: (column: SystemDatatableColumnDraft) => void;
}) {
  const isExisting = column?.kind === 'existing';
  const [name, setName] = useState('');
  const [type, setType] = useState<SystemDatatableColumnType>('String');
  const [length, setLength] = useState('');
  const [code, setCode] = useState<string | undefined>();
  const [mandatory, setMandatory] = useState(false);
  const [unique, setUnique] = useState(false);
  const [indexed, setIndexed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(column?.columnName ?? '');
    setType(column?.columnDisplayType ?? 'String');
    setLength(column?.columnLength != null ? String(column.columnLength) : '');
    setCode(column?.columnCode?.trim() || undefined);
    setMandatory(column ? column.isColumnNullable === false : false);
    setUnique(column?.isColumnUnique ?? false);
    setIndexed(column?.isColumnIndexed ?? false);
    setFieldErrors({});
  }, [open, column]);

  const typeDisabled = mode === 'edit' && isExisting;
  const lengthDisabled = type !== 'String' || (mode === 'edit' && isExisting);
  const codeDisabled = type !== 'Dropdown' || (mode === 'edit' && isExisting);
  const flagsDisabled = mode === 'edit' && isExisting;

  const canSubmit = useMemo(() => {
    if (!name.trim()) {
      return false;
    }
    if (type === 'String' && !lengthDisabled && (!length || Number(length) < 1)) {
      return false;
    }
    if (type === 'Dropdown' && !codeDisabled && !code) {
      return false;
    }
    return true;
  }, [name, type, length, code, lengthDisabled, codeDisabled]);

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) {
      nextErrors.name = 'Column name is required';
    }
    if (type === 'String' && !lengthDisabled && (!length || Number(length) < 1)) {
      nextErrors.length = 'Length is required for string columns';
    }
    if (type === 'Dropdown' && !codeDisabled && !code) {
      nextErrors.code = 'Code is required for dropdown columns';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const kind: SystemDatatableColumnKind =
      mode === 'add' ? 'new' : (column?.kind ?? 'existing');

    onSave({
      columnName: name.trim(),
      columnDisplayType: type,
      isColumnNullable: !mandatory,
      isColumnUnique: unique,
      isColumnIndexed: indexed,
      columnLength: type === 'String' ? Number(length) : undefined,
      columnCode: type === 'Dropdown' ? code : undefined,
      kind,
      originalColumnName:
        mode === 'edit' && column?.originalColumnName
          ? column.originalColumnName
          : mode === 'edit' && column?.columnName
            ? column.columnName
            : undefined
    });
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add column' : 'Edit column'}
      description={
        isExisting
          ? 'Existing columns can only be renamed or have their dropdown code updated.'
          : 'Define the column type and validation flags.'
      }
      submitLabel="Save column"
      submitDisabled={!canSubmit}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <TextField
          label="Column name"
          required
          value={name}
          onChange={setName}
          error={fieldErrors.name}
        />

        <SelectField
          label="Column type"
          required
          value={type}
          onValueChange={(value) => setType((value ?? 'String') as SystemDatatableColumnType)}
          options={COLUMN_TYPE_OPTIONS}
          disabled={typeDisabled}
          error={fieldErrors.type}
        />

        {type === 'String' ? (
          <NumericField
            label="Column length"
            required={!lengthDisabled}
            integer
            value={length}
            disabled={lengthDisabled}
            error={fieldErrors.length}
            onChange={setLength}
          />
        ) : null}

        {type === 'Dropdown' ? (
          <SelectField
            label="Column code"
            required={!codeDisabled}
            value={code}
            onValueChange={setCode}
            options={codeOptions}
            disabled={codeDisabled}
            error={fieldErrors.code}
            emptyMessage="No codes found"
          />
        ) : null}

        <SwitchField
          label="Mandatory"
          checked={mandatory}
          onCheckedChange={setMandatory}
          disabled={flagsDisabled}
        />

        <SwitchField
          label="Unique"
          checked={unique}
          onCheckedChange={setUnique}
          disabled={flagsDisabled || mandatory === false}
        />

        <SwitchField
          label="Indexed"
          checked={indexed}
          onCheckedChange={setIndexed}
          disabled={flagsDisabled}
        />
      </div>
    </FormSheet>
  );
}
