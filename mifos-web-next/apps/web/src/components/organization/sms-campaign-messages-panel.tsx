'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SmsCampaignMessageByStatusItem } from '@mifos/api-client';
import { useState, useTransition } from 'react';
import { listSmsCampaignMessagesAction } from '@/actions/sms-campaign';
import { DateField } from '@/components/composites/date-field';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { fineractDateToDate, todayStart } from '@/lib/fineract/date-input';
import { SMS_MESSAGE_STATUS_TABS } from '@/lib/fineract/sms-campaign-display';

export function SmsCampaignMessagesPanel({ campaignId }: { campaignId: number }) {
  const [activeStatus, setActiveStatus] = useState<number>(SMS_MESSAGE_STATUS_TABS[0].status);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [messages, setMessages] = useState<SmsCampaignMessageByStatusItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSearch() {
    setSearchError(null);
    startTransition(async () => {
      const result = await listSmsCampaignMessagesAction(campaignId, {
        status: activeStatus,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locale: FINERACT_LOCALE,
        dateFormat: FINERACT_DATE_FORMAT
      });
      if (!result.ok) {
        setSearchError(result.message);
        setMessages([]);
        return;
      }
      setMessages(result.data.pageItems);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SMS_MESSAGE_STATUS_TABS.map((tab) => (
          <Button
            key={tab.status}
            type="button"
            size="sm"
            variant={activeStatus === tab.status ? 'default' : 'outline'}
            onClick={() => {
              setActiveStatus(tab.status);
              setMessages([]);
              setFromDate('');
              setToDate('');
              setSearchError(null);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <DateField
          id="sms-from-date"
          label="From date"
          value={fromDate}
          onChange={(value) => setFromDate(value ?? '')}
          toDate={toDate ? fineractDateToDate(toDate) : todayStart()}
        />
        <DateField
          id="sms-to-date"
          label="To date"
          value={toDate}
          onChange={(value) => setToDate(value ?? '')}
          toDate={todayStart()}
        />
        <Button type="button" onClick={handleSearch} disabled={pending}>
          {pending ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {searchError ? <p className="text-sm text-destructive">{searchError}</p> : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mobile no.</TableHead>
              <TableHead>Campaign name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length ? (
              messages.map((message, index) => (
                <TableRow key={`${message.mobileNo ?? index}-${index}`}>
                  <TableCell className="max-w-md whitespace-pre-wrap">{message.message ?? '—'}</TableCell>
                  <TableCell>{message.status?.value ?? '—'}</TableCell>
                  <TableCell>{message.mobileNo ?? '—'}</TableCell>
                  <TableCell>{message.campaignName ?? '—'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Search to load messages for this status.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
