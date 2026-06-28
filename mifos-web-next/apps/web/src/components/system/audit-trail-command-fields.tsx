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
  parseAuditTrailCommandFields,
  type AuditTrailCommandField
} from '@/lib/fineract/audit-trail-display';
import { cn } from '@/lib/utils';

function AuditTrailCommandFieldRow({ field }: { field: AuditTrailCommandField }) {
  return (
    <div className={cn('space-y-1', field.kind === 'json' && 'sm:col-span-2')}>
      <dt className="text-sm font-medium text-muted-foreground">{field.label}</dt>
      <dd className="text-sm text-foreground">
        {field.kind === 'json' ? (
          <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
            {field.display}
          </pre>
        ) : (
          <span className="break-words">{field.display}</span>
        )}
      </dd>
    </div>
  );
}

export function AuditTrailCommandFields({
  commandAsJson,
  emptyMessage = 'No command payload available for this entry.'
}: {
  commandAsJson?: string;
  emptyMessage?: string;
}) {
  const fields = useMemo(
    () => parseAuditTrailCommandFields(commandAsJson),
    [commandAsJson]
  );

  if (!fields.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <AuditTrailCommandFieldRow key={field.key} field={field} />
      ))}
    </dl>
  );
}
