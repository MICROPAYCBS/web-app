'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollectionSheetData } from '@/lib/fineract/collection-sheet-sum';
import { Loader2, Play } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { CollectionSheetTable } from '@/components/collections/collection-sheet-table';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  sumCollectionSheetRowTotals,
  transformCollectionSheetRows
} from '@/lib/collections/collection-sheet-rows';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { toastFineractError } from '@/lib/toast-fineract-error';

export type CollectionSheetOfficeOption = {
  id: number;
  name: string;
};

type StaffOption = {
  id: number;
  displayName: string;
};

export function CollectionSheetPageContent({
  offices,
  defaultOfficeId,
  defaultTransactionDate
}: {
  offices: CollectionSheetOfficeOption[];
  defaultOfficeId: number | null;
  defaultTransactionDate: string;
}) {
  const [officeId, setOfficeId] = useState(
    defaultOfficeId != null ? String(defaultOfficeId) : ''
  );
  const [staffId, setStaffId] = useState('');
  const [transactionDate, setTransactionDate] = useState(defaultTransactionDate);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [sheet, setSheet] = useState<CollectionSheetData | null>(null);
  const [pending, startTransition] = useTransition();

  const officeSelectOptions = useMemo(
    () => offices.map((office) => ({ value: String(office.id), label: office.name })),
    [offices]
  );

  const staffSelectOptions = useMemo(
    () => staffOptions.map((member) => ({ value: String(member.id), label: member.displayName })),
    [staffOptions]
  );

  const loadStaff = useCallback(async (nextOfficeId: string) => {
    if (!nextOfficeId) {
      setStaffOptions([]);
      return;
    }

    setStaffLoading(true);
    try {
      const response = await fetch(`/api/collections/staff?officeId=${nextOfficeId}`, {
        credentials: 'include'
      });
      const payload = (await response.json()) as StaffOption[] | { message?: string };
      if (!response.ok) {
        toastFineractError(
          'message' in payload && payload.message ? payload.message : 'Could not load staff.'
        );
        setStaffOptions([]);
        return;
      }
      setStaffOptions(Array.isArray(payload) ? payload : []);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!officeId) {
      setStaffOptions([]);
      setStaffId('');
      return;
    }
    void loadStaff(officeId);
  }, [officeId, loadStaff]);

  const rows = useMemo(
    () => (sheet ? transformCollectionSheetRows(sheet) : []),
    [sheet]
  );
  const totals = useMemo(() => sumCollectionSheetRowTotals(rows), [rows]);

  const handleGenerate = () => {
    if (!officeId || !transactionDate.trim()) {
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/collections/collection-sheet', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: Number(officeId),
          ...(staffId ? { staffId: Number(staffId) } : {}),
          transactionDate
        })
      });
      const payload = (await response.json()) as CollectionSheetData | { message?: string };
      if (!response.ok) {
        toastFineractError(
          'message' in payload && payload.message ? payload.message : 'Could not generate collection sheet.'
        );
        return;
      }
      setSheet(payload as CollectionSheetData);
    });
  };

  const canGenerate = officeId !== '' && transactionDate.trim() !== '';

  return (
    <ListPage
      title="Collection sheet"
      description="Repayments and savings dues expected on a given date for a branch and loan officer."
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Parameters</CardTitle>
          <CardDescription>
            Choose branch and collection date. Optionally filter by loan officer, then generate
            the sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            id="collection-sheet-office"
            label="Branch"
            value={officeId}
            onValueChange={(value) => {
              setOfficeId(value ?? '');
              setStaffId('');
              setSheet(null);
            }}
            options={officeSelectOptions}
            placeholder="Select branch"
          />
          <SelectField
            id="collection-sheet-staff"
            label="Loan officer"
            optional
            value={staffId}
            onValueChange={(value) => {
              setStaffId(value ?? '');
              setSheet(null);
            }}
            options={staffSelectOptions}
            placeholder={
              officeId ? 'All loan officers in branch' : 'Select a branch first'
            }
            disabled={!officeId || staffLoading}
          />
          <TransactionDateField
            id="collection-sheet-date"
            label="Collection date"
            value={transactionDate}
            onChange={(value) => {
              setTransactionDate(value);
              setSheet(null);
            }}
          />
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full md:w-auto"
              disabled={!canGenerate || pending}
              onClick={handleGenerate}
            >
              {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Play className="mr-2 size-4" />
              )}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {sheet ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Results</CardTitle>
            <CardDescription>
              {totals.clientCount.toLocaleString()} customer
              {totals.clientCount === 1 ? '' : 's'} with dues totaling{' '}
              {formatAccountMoney(totals.totalDue)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CollectionSheetTable rows={rows} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <p>Set parameters and generate the sheet to view expected collections.</p>
          </CardContent>
        </Card>
      )}
    </ListPage>
  );
}
