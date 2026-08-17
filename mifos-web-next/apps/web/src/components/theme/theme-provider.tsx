'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useServerInsertedHTML } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  COLOR_PRESETS,
  DEFAULT_COLOR_PRESET,
  isColorPreset,
  type ColorPreset
} from '@/lib/theme-config';

const STORAGE_KEY = 'theme';
const PRESET_STORAGE_KEY = 'color-preset';

export type ThemeSetting = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type { ColorPreset };

export interface ThemeProviderProps {
  children: ReactNode;
  /** @default "system" */
  defaultTheme?: ThemeSetting;
  /** @default true */
  enableSystem?: boolean;
  /** @default "heritage" */
  defaultColorPreset?: ColorPreset;
}

interface ThemeContextValue {
  theme: ThemeSetting;
  setTheme: (theme: ThemeSetting) => void;
  resolvedTheme: ResolvedTheme | undefined;
  colorPreset: ColorPreset;
  setColorPreset: (preset: ColorPreset) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ALLOWED_PRESETS_JSON = JSON.stringify(COLOR_PRESETS.map((preset) => preset.id));

/** Runs before paint to avoid theme flash (injected via useServerInsertedHTML). */
const THEME_BLOCKING_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('${STORAGE_KEY}')||'system';var r=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';d.classList.remove('light','dark');d.classList.add(r);d.style.colorScheme=r;var allowed=${ALLOWED_PRESETS_JSON};var p=localStorage.getItem('${PRESET_STORAGE_KEY}')||'${DEFAULT_COLOR_PRESET}';if(allowed.indexOf(p)<0)p='${DEFAULT_COLOR_PRESET}';d.setAttribute('data-preset',p)}catch(e){}})();`;

function readStoredTheme(): ThemeSetting | null {
  try {
    return localStorage.getItem(STORAGE_KEY) as ThemeSetting | null;
  } catch {
    return null;
  }
}

function readStoredColorPreset(): ColorPreset | null {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY);
    return isColorPreset(stored) ? stored : null;
  } catch {
    return null;
  }
}

function resolveTheme(theme: ThemeSetting, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === 'dark') {
    return 'dark';
  }
  if (theme === 'light') {
    return 'light';
  }
  return systemPrefersDark ? 'dark' : 'light';
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function applyColorPreset(preset: ColorPreset) {
  document.documentElement.setAttribute('data-preset', preset);
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  defaultColorPreset = DEFAULT_COLOR_PRESET
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeSetting>(defaultTheme);
  const [colorPreset, setColorPresetState] = useState<ColorPreset>(defaultColorPreset);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useServerInsertedHTML(() => (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: THEME_BLOCKING_SCRIPT }}
    />
  ));

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStoredTheme();
      const storedPreset = readStoredColorPreset();
      setThemeState(stored ?? defaultTheme);
      setColorPresetState(storedPreset ?? defaultColorPreset);
      setHydrated(true);
    });
  }, [defaultTheme, defaultColorPreset]);

  useEffect(() => {
    if (!enableSystem) {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setSystemPrefersDark(media.matches);
    };
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [enableSystem]);

  const resolvedTheme = useMemo((): ResolvedTheme | undefined => {
    if (!hydrated) {
      return undefined;
    }
    return resolveTheme(theme, systemPrefersDark);
  }, [hydrated, theme, systemPrefersDark]);

  useEffect(() => {
    if (resolvedTheme === undefined) {
      return;
    }
    applyResolvedTheme(resolvedTheme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode */
    }
  }, [resolvedTheme, theme]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    applyColorPreset(colorPreset);
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, colorPreset);
    } catch {
      /* private mode */
    }
  }, [hydrated, colorPreset]);

  const setTheme = useCallback((next: ThemeSetting) => {
    setThemeState(next);
  }, []);

  const setColorPreset = useCallback((next: ColorPreset) => {
    setColorPresetState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, colorPreset, setColorPreset }),
    [theme, setTheme, resolvedTheme, colorPreset, setColorPreset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
