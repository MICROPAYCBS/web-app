'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeSetting } from '@/components/theme/theme-provider';
import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';

const MODES: { value: ThemeSetting; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

/** Light / dark / system choices for the signed-in user menu. */
export function ThemeMenuGroup() {
  const { theme, setTheme } = useTheme();

  return (
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
  );
}
