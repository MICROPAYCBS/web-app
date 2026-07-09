'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxEnrichedItem, CheckerInboxItemContext } from '@/lib/checker-inbox/checker-inbox-item-types';
import { resolveCheckerInboxWorkflowStageContext } from '@/lib/checker-inbox/checker-inbox-workflow-stage-copy';
import { formatCheckerInboxWorkflowStageHeadline } from '@/lib/checker-inbox/workflow-stage-progress';

const CONFIRM_LIST_LIMIT = 8;

export function CheckerInboxReviewHighlights({
  highlights,
  className
}: {
  highlights: string[] | undefined;
  className?: string;
}) {
  if (!highlights?.length) {
    return null;
  }

  return (
    <ul className={className ?? 'space-y-1 text-sm text-muted-foreground'}>
      {highlights.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

/** Structured label/value list for review side panels and detail cards. */
export function CheckerInboxReviewDetailsList({
  highlights
}: {
  highlights: string[] | undefined;
}) {
  if (!highlights?.length) {
    return null;
  }

  return (
    <dl className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      {highlights.map((line) => {
        const separator = line.indexOf(': ');
        if (separator === -1) {
          return (
            <div key={line}>
              <dd className="text-sm">{line}</dd>
            </div>
          );
        }

        const label = line.slice(0, separator);
        const value = line.slice(separator + 2);

        return (
          <div key={line}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function checkerInboxHasReviewDetails(context: CheckerInboxItemContext): boolean {
  return Boolean(context.commandHighlights?.length || context.summary?.trim());
}

export function checkerInboxReviewDetailCount(context: CheckerInboxItemContext): number {
  return context.commandHighlights?.length ?? 0;
}

export function CheckerInboxConfirmItemList({
  items
}: {
  items: CheckerInboxEnrichedItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  const visible = items.slice(0, CONFIRM_LIST_LIMIT);
  const remaining = items.length - visible.length;

  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
      {visible.map((item) => {
        const stage = resolveCheckerInboxWorkflowStageContext(item.context);
        return (
          <li key={item.id} className="space-y-0.5">
            <p className="font-medium text-foreground">
              #{item.id}
              {item.context.summary ? ` — ${item.context.summary}` : ''}
            </p>
            {stage ? (
              <p className="text-xs text-primary">
                Stage: {formatCheckerInboxWorkflowStageHeadline(stage)}
              </p>
            ) : null}
            <CheckerInboxReviewHighlights highlights={item.context.commandHighlights} />
          </li>
        );
      })}
      {remaining > 0 ? (
        <li className="text-muted-foreground">+ {remaining} more selected</li>
      ) : null}
    </ul>
  );
}

export function checkerInboxConfirmDescription(
  context: CheckerInboxItemContext,
  itemId: number
): string {
  const summary = context.summary?.trim();
  if (summary) {
    return `Checker #${itemId}: ${summary}`;
  }
  return `Checker #${itemId}`;
}
