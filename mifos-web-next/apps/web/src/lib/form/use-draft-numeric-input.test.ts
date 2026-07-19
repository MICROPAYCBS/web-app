/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftNumericInput } from './use-draft-numeric-input';

describe('useDraftNumericInput', () => {
  it('preserves in-progress decimals while typing', () => {
    let draft: number | undefined;
    const { result } = renderHook(() =>
      useDraftNumericInput(draft, (value) => {
        draft = value;
      })
    );

    act(() => result.current.onInputChange('0'));
    expect(result.current.input).toBe('0');
    expect(draft).toBe(0);

    act(() => result.current.onInputChange('0.'));
    expect(result.current.input).toBe('0.');
    expect(draft).toBeUndefined();

    act(() => result.current.onInputChange('0.5'));
    expect(result.current.input).toBe('0.5');
    expect(draft).toBe(0.5);
  });

  it('commits trailing dot on blur', () => {
    let draft: number | undefined;
    const { result } = renderHook(() =>
      useDraftNumericInput(draft, (value) => {
        draft = value;
      })
    );

    act(() => result.current.onInputChange('0.'));
    act(() => result.current.onInputBlur());
    expect(result.current.input).toBe('0');
    expect(draft).toBe(0);
  });
});
