'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { cleanFieldLabelText, humanizeFieldKey } from './wizard-field-error-label';

const FIELD_SCROLL_MARGIN = '7rem';

export interface WizardFieldErrorSummaryProps {
  errors: Record<string, string | undefined>;
  className?: string;
}

function controlLabels(node: Element | null): NodeListOf<HTMLLabelElement> | null | undefined {
  if (
    node instanceof HTMLButtonElement ||
    node instanceof HTMLInputElement ||
    node instanceof HTMLSelectElement ||
    node instanceof HTMLTextAreaElement
  ) {
    return node.labels;
  }
  return undefined;
}

function readMountedFieldLabel(id: string): string | undefined {
  const node = document.getElementById(id);
  const fromControl = cleanFieldLabelText(controlLabels(node)?.[0]?.textContent);
  if (fromControl) {
    return fromControl;
  }
  const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
  return cleanFieldLabelText(explicit?.textContent);
}

function revealField(id: string, scrollMarginTop: string) {
  const node = document.getElementById(id);
  if (!(node instanceof HTMLElement)) {
    return;
  }
  node.style.scrollMarginTop = scrollMarginTop;
  node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  node.focus({ preventScroll: true });
}

/**
 * Names every validation error on the current wizard step and jumps to the field.
 * Step rails only say "Needs attention", and the failing control is often below the fold.
 */
export function WizardFieldErrorSummary({ errors, className }: WizardFieldErrorSummaryProps) {
  const entries = useMemo(
    () => Object.entries(errors).filter((entry): entry is [string, string] => Boolean(entry[1])),
    [errors]
  );
  const fieldIds = entries.map(([id]) => id).join('\0');
  const [labels, setLabels] = useState<Record<string, string>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  function scrollMarginTop() {
    const height = summaryRef.current?.offsetHeight;
    return height ? `${height + 12}px` : FIELD_SCROLL_MARGIN;
  }

  useEffect(() => {
    if (!fieldIds) {
      return;
    }
    const ids = fieldIds.split('\0');
    const next: Record<string, string> = {};
    for (const id of ids) {
      next[id] = readMountedFieldLabel(id) ?? humanizeFieldKey(id);
    }
    setLabels(next);
    const firstId = ids[0];
    if (firstId) {
      revealField(firstId, scrollMarginTop());
    }
  }, [fieldIds]);

  if (entries.length === 0) {
    return null;
  }

  const heading =
    entries.length === 1 ? '1 field needs attention' : `${entries.length} fields need attention`;

  return (
    <div
      ref={summaryRef}
      className={cn(
        'sticky top-0 z-10 -mx-4 mb-4 bg-background px-4 pb-3 md:-mx-6 md:px-6',
        className
      )}
    >
      <div
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3"
      >
        <p className="text-sm font-medium text-destructive">{heading}</p>
        <ul className="mt-2 space-y-1">
          {entries.map(([id, message]) => {
            const label = labels[id] ?? humanizeFieldKey(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  className="text-left text-sm text-destructive underline-offset-2 hover:underline"
                  onClick={() => revealField(id, scrollMarginTop())}
                >
                  <span className="font-medium">{label}</span>
                  {': '}
                  {message}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
