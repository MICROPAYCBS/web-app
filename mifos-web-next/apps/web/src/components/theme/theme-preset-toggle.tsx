'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useTheme } from '@/components/theme/theme-provider';
import { Button } from '@/components/ui/button';
import { COLOR_PRESETS } from '@/lib/theme-config';
import { cn } from '@/lib/utils';

/** Compact Heritage / Neutral picker for login and other unsigned-in surfaces. */
export function ThemePresetToggle({ className }: { className?: string }) {
  const { colorPreset, setColorPreset } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5',
        className
      )}
      role="group"
      aria-label="Theme"
    >
      {COLOR_PRESETS.map(({ id, label }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 gap-1.5 px-2 text-xs text-muted-foreground',
            colorPreset === id && 'bg-background text-foreground shadow-sm'
          )}
          aria-pressed={colorPreset === id}
          aria-label={label}
          onClick={() => setColorPreset(id)}
        >
          <span
            className={cn(
              'size-3.5 shrink-0 rounded-full border border-border',
              id === 'heritage' && 'bg-swatch-heritage',
              id === 'neutral' && 'bg-swatch-neutral',
              id === 'micropay' && 'bg-swatch-micropay'
            )}
            aria-hidden
          />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
