'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkImportHistoryItem, BulkImportStaffOption } from '@mifos/api-client';
import type { FineractOfficeOption } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  loadBulkImportStaffAction,
  refreshBulkImportHistoryAction,
  uploadBulkImportFileAction
} from '@/actions/bulk-import';
import { BulkImportImportsTable } from '@/components/organization/bulk-import-imports-table';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bulkImportDisplayName, type BulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { BULK_IMPORT_LIST_PATH, bulkImportTemplateApiPath } from '@/lib/fineract/bulk-import-paths';
import { resolveClientLegalFormTypeFromSelection } from '@/lib/fineract/bulk-import-display';
import { toSelectOptions } from '@/lib/form/select-options';

type BulkImportFormState = {
  officeId: string;
  staffId: string;
  legalForm: string;
};

function defaultFormState(): BulkImportFormState {
  return {
    officeId: '',
    staffId: '',
    legalForm: ''
  };
}

export function BulkImportDetailPageContent({
  definition,
  offices,
  imports: initialImports,
  canDownload
}: {
  definition: BulkImportDefinition;
  offices: FineractOfficeOption[];
  imports: BulkImportHistoryItem[];
  canDownload: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<BulkImportFormState>(defaultFormState);
  const [staffOptions, setStaffOptions] = useState<BulkImportStaffOption[]>([]);
  const [imports, setImports] = useState(initialImports);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingStaff, startStaffTransition] = useTransition();
  const [refreshing, startRefreshTransition] = useTransition();
  const [uploading, startUploadTransition] = useTransition();

  const officeOptions = useMemo(() => toSelectOptions(offices), [offices]);
  const staffSelectOptions = useMemo(() => toSelectOptions(staffOptions), [staffOptions]);
  const importLabel = bulkImportDisplayName(definition.name);

  const showOffice = definition.formFields >= 1;
  const showStaff = definition.formFields >= 2;
  const showLegalForm = definition.formFields === 3;
  const isClients = definition.name === 'Clients';

  function handleOfficeChange(officeId: string) {
    setForm({ officeId, staffId: '', legalForm: form.legalForm });
    setStaffOptions([]);

    if (!officeId || !showStaff) {
      return;
    }

    startStaffTransition(async () => {
      const result = await loadBulkImportStaffAction(officeId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setStaffOptions(result.data);
    });
  }

  function handleDownloadTemplate() {
    const base = bulkImportTemplateApiPath(definition.name);
    const params = new URLSearchParams();
    if (form.officeId) {
      params.set('officeId', form.officeId);
    }
    if (form.staffId) {
      params.set('staffId', form.staffId);
    }
    if (isClients) {
      const legalFormType = resolveClientLegalFormTypeFromSelection(form.legalForm);
      if (legalFormType) {
        params.set('legalFormType', legalFormType);
      }
    }
    const query = params.toString();
    window.open(query ? `${base}&${query}` : base, '_blank');
  }

  function handleRefresh() {
    startRefreshTransition(async () => {
      const result = await refreshBulkImportHistoryAction(definition.name);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setImports(result.data);
      router.refresh();
    });
  }

  function handleUpload() {
    if (!selectedFile) {
      return;
    }

    const payload = new FormData();
    payload.set('file', selectedFile);

    startUploadTransition(async () => {
      const result = await uploadBulkImportFileAction(definition.name, payload);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Import file uploaded.');
      setSelectedFile(null);
      handleRefresh();
    });
  }

  return (
    <ListPage
      title={importLabel}
      description="Download a template, fill it in Excel, then upload the completed file."
      backLink={<DetailBackLink href={BULK_IMPORT_LIST_PATH} label="Back to bulk import" />}
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-4 rounded-lg border border-border p-4">
            <h2 className="text-base font-medium">{importLabel} template</h2>
            <div className="space-y-4">
              {showOffice ? (
                <SelectField
                  id="bulk-import-office"
                  label="Branch"
                  value={form.officeId || undefined}
                  onValueChange={(value) => handleOfficeChange(value ?? '')}
                  options={officeOptions}
                  placeholder="Select branch"
                  disabled={loadingStaff || uploading}
                />
              ) : null}

              {showStaff ? (
                <SelectField
                  id="bulk-import-staff"
                  label="Staff"
                  value={form.staffId || undefined}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, staffId: value ?? '' }))
                  }
                  options={staffSelectOptions}
                  placeholder="Select staff"
                  disabled={!form.officeId || loadingStaff || uploading}
                />
              ) : null}

              {showLegalForm ? (
                <SelectField
                  id="bulk-import-legal-form"
                  label="Legal form"
                  required
                  value={form.legalForm || undefined}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, legalForm: value ?? '' }))
                  }
                  options={[
                    { value: 'Person', label: 'Person' },
                    { value: 'Entity', label: 'Entity' }
                  ]}
                  disabled={uploading}
                />
              ) : null}
            </div>

            <Can permission={definition.downloadPermission}>
              {canDownload ? (
                <Button type="button" onClick={handleDownloadTemplate} disabled={uploading}>
                  <Download className="mr-2 size-4" />
                  Download template
                </Button>
              ) : null}
            </Can>
          </section>

          <section className="space-y-4 rounded-lg border border-border p-4">
            <h2 className="text-base font-medium">{importLabel}</h2>
            <div className="space-y-2">
              <label htmlFor="bulk-import-file" className="text-sm font-medium">
                Select Excel file
              </label>
              <Input
                id="bulk-import-file"
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
              {isClients ? (
                <p className="text-sm text-muted-foreground">
                  Retain the value Entity or Person in the filename.
                </p>
              ) : null}
            </div>
            <Button type="button" disabled={!selectedFile || uploading} onClick={handleUpload}>
              <Upload className="mr-2 size-4" />
              Upload
            </Button>
          </section>
        </div>

        <section className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-medium">Documents</h2>
            <Button type="button" variant="outline" disabled={refreshing} onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
          <BulkImportImportsTable imports={imports} />
        </section>
      </div>
    </ListPage>
  );
}
