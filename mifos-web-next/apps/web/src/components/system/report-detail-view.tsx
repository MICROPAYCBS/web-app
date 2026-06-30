'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportDetail } from '@mifos/api-client';
import { Pencil, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { deleteReportAction } from '@/actions/reports';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { formatReportCategory, resolveReportParameterEngineName, yesNoLabel } from '@/lib/fineract/report-display';
import { cn } from '@/lib/utils';

export function ReportDetailView({
  report,
  canUpdate,
  canDelete,
  canRun = false
}: {
  report: FineractReportDetail;
  canUpdate: boolean;
  canDelete: boolean;
  canRun?: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const basePath = `/system/reports/${report.id}`;

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteReportAction(report.id);
      if (!result.ok) {

        setActionError(result.message);
        toast.error(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Report deleted.', pending: 'Report deleted sent for approval.' });
      router.push('/system/reports');
      router.refresh();
    });
  }

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/system/reports" label="Back to report configuration" />}
          title={report.reportName}
          meta={`${report.reportType}${report.reportSubType ? ` · ${report.reportSubType}` : ''}`}
          actions={
            <div className="flex flex-wrap gap-2">
              {canRun && report.useReport ? (
                <Link href={`/reports/${report.id}`} className={cn(buttonVariants({ variant: 'outline' }))}>
                  <Play className="mr-2 size-4" />
                  Run report
                </Link>
              ) : null}
              {canUpdate ? (
                <Link href={`${basePath}/edit`} className={cn(buttonVariants())}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              ) : null}
              {canDelete && !report.coreReport ? (
                <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              ) : null}
            </div>
          }
        />
      }
      summary={
        <DetailFieldGrid columns={2}>
          <DetailField label="Type">{report.reportType}</DetailField>
          <DetailField label="Sub-type">{report.reportSubType ?? '—'}</DetailField>
          <DetailField label="Category">{formatReportCategory(report.reportCategory)}</DetailField>
          <DetailField label="Core report">{yesNoLabel(report.coreReport)}</DetailField>
          <DetailField label="User report">{yesNoLabel(report.useReport)}</DetailField>
          <DetailField label="Description">{report.description?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      }
    >
      <div className="space-y-6">
        {report.reportSql ? (
          <div className="space-y-2 rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium">Report SQL</h3>
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-4 text-xs whitespace-pre-wrap">
              {report.reportSql}
            </pre>
          </div>
        ) : null}

        {report.reportParameters?.length ? (
          <div className="space-y-3 rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-medium">Parameters</h3>
            <div className="overflow-hidden rounded-md border border-border">
              <div className="grid grid-cols-2 gap-2 border-b border-border bg-muted/40 px-4 py-2 text-sm font-medium">
                <span>Parameter</span>
                <span>Passed to report engine</span>
              </div>
              {report.reportParameters.map((parameter, index) => (
                <div
                  key={`${parameter.parameterId}-${index}`}
                  className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0"
                >
                  <span>{parameter.parameterName ?? parameter.parameterId}</span>
                  <span className="font-mono text-muted-foreground">
                    {resolveReportParameterEngineName(parameter, report.allowedParameters) ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete report</DialogTitle>
            <DialogDescription>
              Delete <strong>{report.reportName}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Delete report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailPage>
  );
}
