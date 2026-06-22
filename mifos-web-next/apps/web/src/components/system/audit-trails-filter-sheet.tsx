'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailSearchTemplate } from '@mifos/api-client';
import { useEffect, useMemo, useState } from 'react';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Separator } from '@/components/ui/separator';
import {
  combineAuditTrailDateTime,
  splitAuditTrailDateTime,
  type AuditTrailSearchFilters
} from '@/lib/fineract/audit-trail-query';
import { formatAuditTrailFilterLabel } from '@/lib/fineract/audit-trail-display';

function toFilterOptions(values: string[]) {
  return values.map((value) => ({
    value,
    label: formatAuditTrailFilterLabel(value),
    keywords: [value, formatAuditTrailFilterLabel(value)]
  }));
}

export function AuditTrailsFilterSheet({
  open,
  onOpenChange,
  template,
  filters,
  onApply,
  onClear,
  disabled = false,
  pending = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractAuditTrailSearchTemplate;
  filters: AuditTrailSearchFilters;
  onApply: (filters: AuditTrailSearchFilters) => void;
  onClear: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const [draft, setDraft] = useState(filters);
  const makerFrom = splitAuditTrailDateTime(filters.makerDateTimeFrom);
  const makerTo = splitAuditTrailDateTime(filters.makerDateTimeTo);
  const checkerFrom = splitAuditTrailDateTime(filters.checkerDateTimeFrom);
  const checkerTo = splitAuditTrailDateTime(filters.checkerDateTimeTo);

  const [makerFromDate, setMakerFromDate] = useState(makerFrom.date);
  const [makerFromTime, setMakerFromTime] = useState(makerFrom.time);
  const [makerToDate, setMakerToDate] = useState(makerTo.date);
  const [makerToTime, setMakerToTime] = useState(makerTo.time);
  const [checkerFromDate, setCheckerFromDate] = useState(checkerFrom.date);
  const [checkerFromTime, setCheckerFromTime] = useState(checkerFrom.time);
  const [checkerToDate, setCheckerToDate] = useState(checkerTo.date);
  const [checkerToTime, setCheckerToTime] = useState(checkerTo.time);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(filters);
    const nextMakerFrom = splitAuditTrailDateTime(filters.makerDateTimeFrom);
    const nextMakerTo = splitAuditTrailDateTime(filters.makerDateTimeTo);
    const nextCheckerFrom = splitAuditTrailDateTime(filters.checkerDateTimeFrom);
    const nextCheckerTo = splitAuditTrailDateTime(filters.checkerDateTimeTo);
    setMakerFromDate(nextMakerFrom.date);
    setMakerFromTime(nextMakerFrom.time);
    setMakerToDate(nextMakerTo.date);
    setMakerToTime(nextMakerTo.time);
    setCheckerFromDate(nextCheckerFrom.date);
    setCheckerFromTime(nextCheckerFrom.time);
    setCheckerToDate(nextCheckerTo.date);
    setCheckerToTime(nextCheckerTo.time);
  }, [filters, open]);

  const userOptions = useMemo(
    () =>
      template.appUsers.map((user) => ({
        value: String(user.id),
        label: user.username
      })),
    [template.appUsers]
  );

  const actionOptions = useMemo(
    () => toFilterOptions(template.actionNames),
    [template.actionNames]
  );

  const entityOptions = useMemo(
    () => toFilterOptions(template.entityNames),
    [template.entityNames]
  );

  const statusOptions = useMemo(
    () =>
      template.processingResults.map((item) => ({
        value: String(item.id),
        label: item.processingResult
      })),
    [template.processingResults]
  );

  function handleApply() {
    onApply({
      ...draft,
      makerDateTimeFrom: combineAuditTrailDateTime(makerFromDate, makerFromTime),
      makerDateTimeTo: combineAuditTrailDateTime(makerToDate, makerToTime),
      checkerDateTimeFrom: combineAuditTrailDateTime(checkerFromDate, checkerFromTime),
      checkerDateTimeTo: combineAuditTrailDateTime(checkerToDate, checkerToTime)
    });
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter audit trails"
      description="Work top to bottom: choose what changed, then who was involved and when."
      applyLabel={pending ? 'Searching…' : 'Search'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
      disabled={disabled}
      className="data-[side=right]:sm:max-w-lg"
    >
      <ListFilterSection
        title="What changed"
        description="Each audit entry records an action on a type of record. Start with the record type, then the action, then a specific ID if you know it."
      >
        <SelectField
          label="Entity"
          optional
          value={draft.entityName}
          onValueChange={(value) => setDraft((current) => ({ ...current, entityName: value }))}
          options={entityOptions}
          disabled={disabled || pending}
          placeholder="Any record type"
          hint="The kind of record that was affected—for example Client, Loan, or Office."
          hintAriaLabel="What entity means in audit filters"
        />
        <SelectField
          label="Action"
          optional
          value={draft.actionName}
          onValueChange={(value) => setDraft((current) => ({ ...current, actionName: value }))}
          options={actionOptions}
          disabled={disabled || pending}
          placeholder="Any action"
          hint="What happened to that record—for example Create, Update, Approve, or Delete."
          hintAriaLabel="What action means in audit filters"
        />
        <TextField
          label="Resource ID"
          optional
          value={draft.resourceId ?? ''}
          onChange={(value) => setDraft((current) => ({ ...current, resourceId: value }))}
          disabled={disabled || pending}
          hint="Numeric ID of one specific record. Most useful after you choose Entity so the ID matches the right record type."
          hintAriaLabel="What resource ID means in audit filters"
        />
        <SelectField
          label="Status"
          optional
          value={draft.processingResult}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, processingResult: value }))
          }
          options={statusOptions}
          disabled={disabled || pending}
          placeholder="Any status"
          hint="Whether the change succeeded, failed, or is still awaiting checker approval."
          hintAriaLabel="What status means in audit filters"
        />
      </ListFilterSection>

      <Separator />

      <ListFilterSection
        title="Who was involved"
        description="User is who made the change. Checker is who approved or rejected it on maker-checker workflows."
      >
        <SelectField
          label="User"
          optional
          value={draft.makerId}
          onValueChange={(value) => setDraft((current) => ({ ...current, makerId: value }))}
          options={userOptions}
          disabled={disabled || pending}
          placeholder="Any user"
        />
        <SelectField
          label="Checker"
          optional
          value={draft.checkerId}
          onValueChange={(value) => setDraft((current) => ({ ...current, checkerId: value }))}
          options={userOptions}
          disabled={disabled || pending}
          placeholder="Any checker"
        />
      </ListFilterSection>

      <Separator />

      <ListFilterSection
        title="When it was made"
        description="Filter by the date and time the user submitted the change."
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <TextField
            label="From date"
            type="date"
            value={makerFromDate}
            onChange={setMakerFromDate}
            disabled={disabled || pending}
          />
          <TextField
            label="Time"
            type="time"
            value={makerFromTime}
            onChange={setMakerFromTime}
            disabled={disabled || pending}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <TextField
            label="To date"
            type="date"
            value={makerToDate}
            onChange={setMakerToDate}
            disabled={disabled || pending}
          />
          <TextField
            label="Time"
            type="time"
            value={makerToTime}
            onChange={setMakerToTime}
            disabled={disabled || pending}
          />
        </div>
      </ListFilterSection>

      <Separator />

      <ListFilterSection
        title="When it was checked"
        description="Optional. Use when you need entries approved or rejected in a checker step."
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <TextField
            label="From date"
            type="date"
            value={checkerFromDate}
            onChange={setCheckerFromDate}
            disabled={disabled || pending}
          />
          <TextField
            label="Time"
            type="time"
            value={checkerFromTime}
            onChange={setCheckerFromTime}
            disabled={disabled || pending}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <TextField
            label="To date"
            type="date"
            value={checkerToDate}
            onChange={setCheckerToDate}
            disabled={disabled || pending}
          />
          <TextField
            label="Time"
            type="time"
            value={checkerToTime}
            onChange={setCheckerToTime}
            disabled={disabled || pending}
          />
        </div>
      </ListFilterSection>
    </ListFilterSheet>
  );
}
