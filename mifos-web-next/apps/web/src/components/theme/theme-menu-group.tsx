'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ColorPreset, type ThemeSetting } from '@/components/theme/theme-provider';
import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { COLOR_PRESETS, isColorPreset } from '@/lib/theme-config';
import { cn } from '@/lib/utils';

const MODES: { value: ThemeSetting; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

function ThemeSwatch({ preset }: { preset: ColorPreset }) {
  return (
    <span
      className={cn(
        'size-3.5 shrink-0 rounded-full border border-border',
        preset === 'heritage' && 'bg-swatch-heritage',
        preset === 'neutral' && 'bg-swatch-neutral',
        preset === 'micropay' && 'bg-swatch-micropay'
      )}
      aria-hidden
    />
  );
}

/** Theme palette and light / dark / system choices for the signed-in user menu. */
export function ThemeMenuGroup() {
  const { theme, setTheme, colorPreset, setColorPreset } = useTheme();

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={colorPreset}
          onValueChange={(value) => {
            if (isColorPreset(value)) {
              setColorPreset(value);
            }
          }}
        >
          {COLOR_PRESETS.map(({ id, label }) => (
            <DropdownMenuRadioItem key={id} value={id}>
              <ThemeSwatch preset={id} />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ThemeSetting)}
        >
          {MODES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4" aria-hidden />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
    </>
  );
}
