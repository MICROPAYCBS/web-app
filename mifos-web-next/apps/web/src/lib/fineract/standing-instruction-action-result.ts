/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionTemplate } from '@mifos/api-client';

export type StandingInstructionActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type StandingInstructionTemplateResult =
  | StandingInstructionTemplate
  | Extract<StandingInstructionActionResult, { ok: false }>;

export function isStandingInstructionActionError(
  result: StandingInstructionTemplateResult
): result is Extract<StandingInstructionActionResult, { ok: false }> {
  return 'ok' in result && result.ok === false;
}
