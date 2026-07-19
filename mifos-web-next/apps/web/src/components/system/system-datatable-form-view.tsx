'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableDefinition } from '@mifos/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  createSystemDatatableAction,
  updateSystemDatatableAction
} from '@/actions/system-datatable';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { SystemDatatableColumnsEditor } from '@/components/system/system-datatable-columns-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  APPLICATION_TABLE_OPTIONS,
  buildUpdatePayload,
  draftToColumnInput,
  entitySubTypeOptionsForAppTable,
  prepareEditColumns,
  showEntitySubTypeField,
  filterEditableColumnDrafts,
  type SystemDatatableColumnDraft
} from '@/lib/fineract/system-datatable-form';
import { formatApplicationTableLabel } from '@/lib/fineract/system-datatables-display';
import { cn } from '@/lib/utils';

export function SystemDatatableCreateForm({
  codeOptions
}: {
  codeOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [datatableName, setDatatableName] = useState('');
  const [apptableName, setApptableName] = useState<string | undefined>();
  const [entitySubType, setEntitySubType] = useState<string | undefined>();
  const [multiRow, setMultiRow] = useState(false);
  const [columns, setColumns] = useState<SystemDatatableColumnDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const entitySubTypeOptions = useMemo(
    () => (apptableName ? entitySubTypeOptionsForAppTable(apptableName) : []),
    [apptableName]
  );

  const canSubmit = datatableName.trim().length > 0 && Boolean(apptableName) && columns.length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createSystemDatatableAction(
        {
          datatableName: datatableName.trim(),
          apptableName: apptableName ?? '',
          multiRow,
          entitySubType,
          columns: columns.map((column) => draftToColumnInput(column))
        },
        columns
      );

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      router.push(
        `/system/data-tables/${encodeURIComponent(result.registeredTableName ?? datatableName.trim())}`
      );
      router.refresh();
    });
  }

  return (
    <ListPage
      title="Create data table"
      description="Register a new custom field table and attach it to an entity."
      actions={
        <Link href="/system/data-tables" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancel
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField
                label="Data table name"
                required
                value={datatableName}
                onChange={setDatatableName}
                error={fieldErrors.datatableName}
              />
              <SelectField
                label="Entity type"
                required
                value={apptableName}
                onValueChange={(value) => {
                  setApptableName(value);
                  setEntitySubType(undefined);
                }}
                options={APPLICATION_TABLE_OPTIONS}
                error={fieldErrors.apptableName}
              />
              {apptableName && showEntitySubTypeField(apptableName) ? (
                <SelectField
                  label="Sub type"
                  optional
                  value={entitySubType}
                  onValueChange={setEntitySubType}
                  options={entitySubTypeOptions}
                  error={fieldErrors.entitySubType}
                />
              ) : null}
              <SwitchField
                label="Multi row"
                description="Allow multiple records per entity."
                checked={multiRow}
                onCheckedChange={setMultiRow}
              />
            </div>

            <SystemDatatableColumnsEditor
              columns={columns}
              onChange={setColumns}
              codeOptions={codeOptions}
            />

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            {fieldErrors.columns ? (
              <p className="text-sm text-destructive">{fieldErrors.columns}</p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t px-6 py-4">
            <Button type="submit" disabled={!canSubmit || pending}>
              {pending ? 'Creating…' : 'Create data table'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </ListPage>
  );
}

export function SystemDatatableEditForm({
  definition,
  codeOptions
}: {
  definition: FineractDatatableDefinition;
  codeOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const registeredTableName = definition.registeredTableName ?? '';
  const initialColumns = useMemo(() => prepareEditColumns(definition), [definition]);
  const [columns, setColumns] = useState<SystemDatatableColumnDraft[]>(initialColumns);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  function handleColumnsChange(nextColumns: SystemDatatableColumnDraft[]) {
    setColumns(filterEditableColumnDrafts(nextColumns));
  }
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSubmit = columns.length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const payload = buildUpdatePayload(
      initialColumns,
      columns,
      definition.applicationTableName ?? '',
      definition.entitySubType
    );

    startTransition(async () => {
      const result = await updateSystemDatatableAction(registeredTableName, payload, {
        columnDrafts: columns,
        initialColumnDrafts: initialColumns
      });
      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      router.push(`/system/data-tables/${encodeURIComponent(registeredTableName)}`);
      router.refresh();
    });
  }

  return (
    <ListPage
      title={`Edit ${registeredTableName}`}
      description="Add, rename, or remove columns on this data table."
      actions={
        <Link
          href={`/system/data-tables/${encodeURIComponent(registeredTableName)}`}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Data table name</p>
                <p className="text-sm text-muted-foreground">{registeredTableName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Entity type</p>
                <p className="text-sm text-muted-foreground">
                  {formatApplicationTableLabel(definition.applicationTableName)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Sub type</p>
                <p className="text-sm text-muted-foreground">
                  {definition.entitySubType?.trim() || '—'}
                </p>
              </div>
            </div>

            <SystemDatatableColumnsEditor
              columns={columns}
              onChange={handleColumnsChange}
              codeOptions={codeOptions}
            />

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            {fieldErrors.addColumns ? (
              <p className="text-sm text-destructive">{fieldErrors.addColumns}</p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t px-6 py-4">
            <Button type="submit" disabled={!canSubmit || pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </ListPage>
  );
}
