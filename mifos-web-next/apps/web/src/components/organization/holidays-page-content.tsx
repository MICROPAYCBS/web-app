'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem, HolidayListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { searchHolidaysByOfficeAction } from '@/actions/holidays';
import { HolidaysTable } from '@/components/organization/holidays-table';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { buttonVariants } from '@/components/ui/button';
import { holidayCreatePath } from '@/lib/fineract/holiday-paths';
import { toSelectOptions } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';

export function HolidaysPageContent({ offices }: { offices: FineractOfficeListItem[] }) {
  const [officeId, setOfficeId] = useState('');
  const [holidays, setHolidays] = useState<HolidayListItem[]>([]);
  const [pending, startTransition] = useTransition();

  const officeOptions = useMemo(() => toSelectOptions(offices), [offices]);

  useEffect(() => {
    if (!officeId) {
      setHolidays([]);
      return;
    }

    startTransition(async () => {
      const result = await searchHolidaysByOfficeAction(officeId);
      if (!result.ok) {
        toast.error(result.message);
        setHolidays([]);
        return;
      }
      setHolidays(result.data ?? []);
    });
  }, [officeId]);

  return (
    <ListPage
      title="Holidays"
      description="Manage institution holidays and how loan repayments are rescheduled."
      actions={
        <Can permission="CREATE_HOLIDAY">
          <Link href={holidayCreatePath()} className={cn(buttonVariants())}>
            Create holiday
          </Link>
        </Can>
      }
    >
      <div className="space-y-4">
        <SelectField
          id="holiday-office-filter"
          label="Branch"
          required
          value={officeId}
          onValueChange={(value) => setOfficeId(value ?? '')}
          options={officeOptions}
          placeholder="Select a branch"
          disabled={pending}
        />

        {officeId ? (
          <HolidaysTable holidays={holidays} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a branch to view holidays for that office.
          </p>
        )}
      </div>
    </ListPage>
  );
}
