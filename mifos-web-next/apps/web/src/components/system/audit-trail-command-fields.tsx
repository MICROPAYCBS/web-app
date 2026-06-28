'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import {
  parseAuditTrailCommandFieldsWithDiff,
  type AuditTrailCommandField
} from '@/lib/fineract/audit-trail-display';
import { cn } from '@/lib/utils';

function AuditTrailFieldValue({
  display,
  kind,
  tone
}: {
  display: string;
  kind: 'text' | 'json';
  tone: 'was' | 'now' | 'single';
}) {
  if (kind === 'json') {
    return (
      <pre
        className={cn(
          'mt-1 max-h-64 overflow-auto rounded-md border border-border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words',
          tone === 'was' && 'bg-muted/30 text-muted-foreground',
          tone === 'now' && 'bg-background',
          tone === 'single' && 'bg-muted/50'
        )}
      >
        {display}
      </pre>
    );
  }

  return (
    <span
      className={cn(
        'break-words',
        tone === 'was' && 'text-muted-foreground line-through decoration-muted-foreground/60',
        tone === 'now' && 'font-medium text-foreground',
        tone === 'single' && 'text-foreground'
      )}
    >
      {display}
    </span>
  );
}

function AuditTrailCommandFieldRow({ field }: { field: AuditTrailCommandField }) {
  const showDiff = field.changeType !== 'unchanged';
  const isWide = field.kind === 'json' || field.previousKind === 'json';

  return (
    <div
      className={cn(
        'space-y-1 rounded-md px-2 py-1.5 -mx-2',
        isWide && 'sm:col-span-2',
        showDiff && 'border-l-2 border-primary bg-accent/50'
      )}
    >
      <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
      <dd className="text-sm">
        {showDiff ? (
          <div className="mt-1 space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Was</p>
              <AuditTrailFieldValue
                display={field.previousDisplay ?? '—'}
                kind={field.previousKind ?? 'text'}
                tone="was"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Now</p>
              <AuditTrailFieldValue display={field.display} kind={field.kind} tone="now" />
            </div>
          </div>
        ) : (
          <AuditTrailFieldValue display={field.display} kind={field.kind} tone="single" />
        )}
      </dd>
    </div>
  );
}

export function AuditTrailCommandFields({
  commandAsJson,
  previousCommandAsJson,
  emptyMessage = 'No command payload available for this entry.'
}: {
  commandAsJson?: string;
  previousCommandAsJson?: string;
  emptyMessage?: string;
}) {
  const fields = useMemo(
    () => parseAuditTrailCommandFieldsWithDiff(commandAsJson, previousCommandAsJson),
    [commandAsJson, previousCommandAsJson]
  );

  const hasPrevious = Boolean(previousCommandAsJson?.trim());
  const changedCount = fields.filter((field) => field.changeType !== 'unchanged').length;

  if (!fields.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {hasPrevious ? (
        changedCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {changedCount} {changedCount === 1 ? 'field changed' : 'fields changed'} in this
            action compared to the previous audit entry. Omitted or empty values are treated as
            unchanged.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No field values differ from the previous audit entry.
          </p>
        )
      ) : null}
      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <AuditTrailCommandFieldRow key={field.key} field={field} />
        ))}
      </dl>
    </div>
  );
}
