'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportRunParameter } from '@mifos/api-client';
import { Play } from 'lucide-react';
import { useId } from 'react';
import { ReportParameterForm } from '@/components/reports/report-parameter-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

export function ReportParameterSheet({
  open,
  onOpenChange,
  reportName,
  parameters,
  pending = false,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName: string;
  parameters: FineractReportRunParameter[];
  pending?: boolean;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const formId = useId();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>Report parameters</SheetTitle>
          <SheetDescription>
            Configure values for <span className="font-medium text-foreground">{reportName}</span>{' '}
            before running.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ReportParameterForm
            key={parameters.map((parameter) => parameter.parameterVariable || parameter.parameterName).join('|')}
            formId={formId}
            parameters={parameters}
            disabled={pending}
            onSubmit={(values) => {
              onSubmit(values);
              onOpenChange(false);
            }}
          />
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            <Play className="mr-2 size-4" />
            {pending ? 'Running…' : 'Run report'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
