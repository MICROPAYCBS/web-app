'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type ThemeSetting } from '@/components/theme/theme-provider';
import { cn } from '@/lib/utils';

const MODES: { value: ThemeSetting; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
];

export function ThemeToggle({
  className,
  variant = 'default'
}: {
  className?: string;
  variant?: 'default' | 'loginRow';
}) {
  const { theme, setTheme } = useTheme();
  const isLoginRow = variant === 'loginRow';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5',
        isLoginRow && 'h-10 w-full',
        className
      )}
      role="group"
      aria-label="Color mode"
    >
      {MODES.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'text-muted-foreground',
            isLoginRow ? 'h-9 min-w-0 flex-1 gap-1 px-1.5' : 'h-8 gap-1.5 px-2.5',
            theme === value && 'bg-background text-foreground shadow-sm'
          )}
          aria-pressed={theme === value}
          aria-label={label}
          onClick={() => setTheme(value)}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className={cn(isLoginRow ? 'sr-only' : 'hidden sm:inline')}>{label}</span>
        </Button>
      ))}
    </div>
  );
}
