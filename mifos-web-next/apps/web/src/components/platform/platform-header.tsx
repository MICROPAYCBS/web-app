'use client';

import { AppLink } from '@/components/routes/app-link';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const PRESETS = ['default', 'ocean', 'finance'] as const;

export function PlatformHeader({
  serverName
}: {
  serverName?: string | null;
}) {
  const { theme, setTheme } = useTheme();

  function cyclePreset() {
    const html = document.documentElement;
    const current = html.getAttribute('data-preset') ?? 'default';
    const idx = PRESETS.indexOf(current as (typeof PRESETS)[number]);
    const next = PRESETS[(idx + 1) % PRESETS.length];
    html.setAttribute('data-preset', next);
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold">Mifos Web</h1>
        {serverName ? (
          <p className="truncate text-xs text-muted-foreground">
            {serverName} ·{' '}
            <AppLink
              route="settingsServers"
              className="underline-offset-4 hover:underline"
            >
              Server settings
            </AppLink>
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
