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
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  combineAuditTrailDateTime,
  splitAuditTrailDateTime,
  type AuditTrailSearchFilters
} from '@/lib/fineract/audit-trail-query';

export function AuditTrailsFilters({
  template,
  filters,
  onApply,
  onClear,
  disabled = false
}: {
  template: FineractAuditTrailSearchTemplate;
  filters: AuditTrailSearchFilters;
  onApply: (filters: AuditTrailSearchFilters) => void;
  onClear: () => void;
  disabled?: boolean;
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
  }, [filters]);

  const userOptions = useMemo(
    () =>
      template.appUsers.map((user) => ({
        value: String(user.id),
        label: user.username
      })),
    [template.appUsers]
  );

  const actionOptions = useMemo(
    () => template.actionNames.map((action) => ({ value: action, label: action })),
    [template.actionNames]
  );

  const entityOptions = useMemo(
    () => template.entityNames.map((entity) => ({ value: entity, label: entity })),
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
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Resource ID"
            value={draft.resourceId ?? ''}
            onChange={(value) => setDraft((current) => ({ ...current, resourceId: value }))}
            disabled={disabled}
          />
          <SelectField
            label="Status"
            optional
            value={draft.processingResult}
            onValueChange={(value) =>
              setDraft((current) => ({ ...current, processingResult: value }))
            }
            options={statusOptions}
            disabled={disabled}
            placeholder="Any status"
          />
          <SelectField
            label="User"
            optional
            value={draft.makerId}
            onValueChange={(value) => setDraft((current) => ({ ...current, makerId: value }))}
            options={userOptions}
            disabled={disabled}
            placeholder="Any user"
          />
          <SelectField
            label="Action"
            optional
            value={draft.actionName}
            onValueChange={(value) => setDraft((current) => ({ ...current, actionName: value }))}
            options={actionOptions}
            disabled={disabled}
            placeholder="Any action"
          />
          <SelectField
            label="Entity"
            optional
            value={draft.entityName}
            onValueChange={(value) => setDraft((current) => ({ ...current, entityName: value }))}
            options={entityOptions}
            disabled={disabled}
            placeholder="Any entity"
          />
          <SelectField
            label="Checker"
            optional
            value={draft.checkerId}
            onValueChange={(value) => setDraft((current) => ({ ...current, checkerId: value }))}
            options={userOptions}
            disabled={disabled}
            placeholder="Any checker"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <TextField
              label="Maker from date"
              type="date"
              value={makerFromDate}
              onChange={setMakerFromDate}
              disabled={disabled}
            />
            <TextField
              label="Time"
              type="time"
              value={makerFromTime}
              onChange={setMakerFromTime}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <TextField
              label="Maker to date"
              type="date"
              value={makerToDate}
              onChange={setMakerToDate}
              disabled={disabled}
            />
            <TextField
              label="Time"
              type="time"
              value={makerToTime}
              onChange={setMakerToTime}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <TextField
              label="Checker from date"
              type="date"
              value={checkerFromDate}
              onChange={setCheckerFromDate}
              disabled={disabled}
            />
            <TextField
              label="Time"
              type="time"
              value={checkerFromTime}
              onChange={setCheckerFromTime}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <TextField
              label="Checker to date"
              type="date"
              value={checkerToDate}
              onChange={setCheckerToDate}
              disabled={disabled}
            />
            <TextField
              label="Time"
              type="time"
              value={checkerToTime}
              onChange={setCheckerToTime}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleApply} disabled={disabled}>
            Apply filters
          </Button>
          <Button type="button" variant="outline" onClick={onClear} disabled={disabled}>
            Clear filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
