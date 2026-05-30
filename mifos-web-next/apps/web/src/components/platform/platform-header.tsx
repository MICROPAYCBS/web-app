/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use client';

import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const PRESETS = ['default', 'ocean', 'finance'] as const;

export function PlatformHeader() {
  const { theme, setTheme } = useTheme();

  function cyclePreset() {
    const html = document.documentElement;
    const current = html.getAttribute('data-preset') ?? 'default';
    const idx = PRESETS.indexOf(current as (typeof PRESETS)[number]);
    const next = PRESETS[(idx + 1) % PRESETS.length];
    html.setAttribute('data-preset', next);
  }

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <h1 className="text-lg font-semibold">Mifos Web</h1>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={cyclePreset}>
          Cycle preset
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          Toggle theme
        </Button>
      </div>
    </div>
  );
}
