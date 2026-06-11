'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { SmsCampaignWizardDraft } from '../types';
import type { StepErrors } from '../validation';

export function MessageStep({
  draft,
  onChange,
  errors
}: {
  draft: SmsCampaignWizardDraft;
  onChange: (patch: Partial<SmsCampaignWizardDraft>) => void;
  errors: StepErrors;
}) {
  function insertPlaceholder(columnName: string) {
    const token = ` {{${columnName}}} `;
    onChange({ message: `${draft.message}${token}` });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div>
        <h2 className="text-sm font-medium">Campaign message</h2>
        <p className="text-sm text-muted-foreground">
          Compose the SMS body. Insert placeholders from the business rule columns.
        </p>
      </div>

      {draft.templateColumns.length ? (
        <div className="flex flex-wrap gap-2">
          {draft.templateColumns.map((column) => (
            <Button
              key={column.columnName}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertPlaceholder(column.columnName)}
            >
              {column.columnName}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No placeholders loaded. Go back to the campaign step and load template placeholders.
        </p>
      )}

      <div className="space-y-2">
        <FieldLabel htmlFor="message">Message</FieldLabel>
        <Textarea
          id="message"
          rows={8}
          value={draft.message}
          onChange={(event) => onChange({ message: event.target.value })}
          placeholder="Type your campaign message"
        />
        {errors.message ? <p className="text-sm text-destructive">{errors.message}</p> : null}
      </div>
    </div>
  );
}
