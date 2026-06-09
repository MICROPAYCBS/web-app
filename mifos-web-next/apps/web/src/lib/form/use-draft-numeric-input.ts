/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';

function formatDraftNumeric(value: number | undefined): string {
  return value != null ? String(value) : '';
}

function parseDraftNumeric(value: string): number | undefined {
  if (value === '' || value === '.' || value.endsWith('.')) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Keeps a string input in sync with a numeric draft field without breaking
 * in-progress decimals (e.g. "0." while typing "0.5").
 */
export function useDraftNumericInput(
  draftValue: number | undefined,
  onDraftChange: (value: number | undefined) => void,
  resetKey?: unknown
) {
  const [input, setInput] = useState(() => formatDraftNumeric(draftValue));

  useEffect(() => {
    setInput(formatDraftNumeric(draftValue));
  }, [resetKey]);

  function onInputChange(value: string) {
    setInput(value);
    onDraftChange(parseDraftNumeric(value));
  }

  function onInputBlur() {
    if (!input.endsWith('.')) {
      return;
    }
    const trimmed = input.slice(0, -1);
    setInput(trimmed);
    onDraftChange(parseDraftNumeric(trimmed));
  }

  return { input, onInputChange, onInputBlur };
}
