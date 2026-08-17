/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** shadcn/ui create preset for Heritage — decode: `npx shadcn@latest preset decode bJMSkfGi` */
export const SHADCN_PRESET_CODE = 'bJMSkfGi' as const;

/** shadcn/ui create preset for Neutral — decode: `npx shadcn@latest preset decode b0` */
export const NEUTRAL_SHADCN_PRESET_CODE = 'b0' as const;

/** Brand palette from micropay.co.ug (contact form + site theme: ink, marigold, moss). */

export const SHADCN_PRESET_URL = `https://ui.shadcn.com/create?preset=${SHADCN_PRESET_CODE}`;

export const COLOR_PRESETS = [
  { id: 'heritage', label: 'Heritage', shadcnCode: SHADCN_PRESET_CODE },
  { id: 'neutral', label: 'Neutral', shadcnCode: NEUTRAL_SHADCN_PRESET_CODE },
  { id: 'micropay', label: 'MicroPay' }
] as const;

export type ColorPreset = (typeof COLOR_PRESETS)[number]['id'];

export const DEFAULT_COLOR_PRESET: ColorPreset = 'heritage';

const COLOR_PRESET_IDS = new Set<string>(COLOR_PRESETS.map((preset) => preset.id));

export function isColorPreset(value: string | null | undefined): value is ColorPreset {
  return value != null && COLOR_PRESET_IDS.has(value);
}
