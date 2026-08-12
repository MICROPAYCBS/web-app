'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserListItem } from '@mifos/api-client';
import { useEffect, useMemo, useState } from 'react';
import { DateField } from '@/components/composites/date-field';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import { fineractDateToIso, isoDateToFineract } from '@/lib/fineract/date-input';
import type { UserSessionHistoryQuery } from '@/lib/fineract/user-session-query';

const ALL_USERS = '__all__';

export function LoginHistoryFilterSheet({
  open,
  onOpenChange,
  users,
  query,
  onApply,
  onClear,
  pending = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: FineractUserListItem[];
  query: UserSessionHistoryQuery;
  onApply: (next: Pick<UserSessionHistoryQuery, 'userId' | 'fromDate' | 'toDate'>) => void;
  onClear: () => void;
  pending?: boolean;
}) {
  const [userId, setUserId] = useState(query.userId != null ? String(query.userId) : ALL_USERS);
  const [fromDate, setFromDate] = useState(
    query.fromDate ? isoDateToFineract(query.fromDate) : undefined
  );
  const [toDate, setToDate] = useState(query.toDate ? isoDateToFineract(query.toDate) : undefined);

  useEffect(() => {
    if (!open) {
      return;
    }
    setUserId(query.userId != null ? String(query.userId) : ALL_USERS);
    setFromDate(query.fromDate ? isoDateToFineract(query.fromDate) : undefined);
    setToDate(query.toDate ? isoDateToFineract(query.toDate) : undefined);
  }, [open, query.fromDate, query.toDate, query.userId]);

  const userOptions = useMemo(
    () => [
      { value: ALL_USERS, label: 'All users' },
      ...users.map((user) => ({
        value: String(user.id),
        label: user.username,
        description: [user.firstname, user.lastname].filter(Boolean).join(' ') || undefined
      }))
    ],
    [users]
  );

  function handleApply() {
    const parsedUserId = userId === ALL_USERS ? undefined : Number(userId);
    onApply({
      userId: Number.isFinite(parsedUserId) && parsedUserId! > 0 ? parsedUserId : undefined,
      fromDate: fineractDateToIso(fromDate) || undefined,
      toDate: fineractDateToIso(toDate) || undefined
    });
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter login history"
      description="Restrict by user and sign-in date."
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
    >
      <ListFilterSection title="User">
        <SelectField
          label="User"
          optional
          value={userId}
          onValueChange={(value) => setUserId(value ?? ALL_USERS)}
          options={userOptions}
          placeholder="All users"
        />
      </ListFilterSection>
      <ListFilterSection title="Signed in">
        <DateField
          label="From"
          optional
          value={fromDate}
          onChange={setFromDate}
          allowFuture={false}
        />
        <DateField label="To" optional value={toDate} onChange={setToDate} allowFuture={false} />
      </ListFilterSection>
    </ListFilterSheet>
  );
}
