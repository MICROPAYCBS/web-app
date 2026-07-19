/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import {
  DEFAULT_STRUCTURED_GL_CODE_LENGTH,
  ENFORCE_STRUCTURED_GL_CODES_CONFIG_NAME,
  STRUCTURED_GL_CODE_LENGTH_CONFIG_NAME,
  type StructuredGlCodePolicy
} from '@/lib/fineract/gl-account-code-policy-paths';

export type { StructuredGlCodePolicy } from '@/lib/fineract/gl-account-code-policy-paths';

export async function getStructuredGlCodePolicy(): Promise<StructuredGlCodePolicy> {
  const [enforceConfiguration, lengthConfiguration] = await Promise.all([
    getGlobalConfigurationByName(ENFORCE_STRUCTURED_GL_CODES_CONFIG_NAME),
    getGlobalConfigurationByName(STRUCTURED_GL_CODE_LENGTH_CONFIG_NAME)
  ]);

  const configuredLength = lengthConfiguration?.value;
  const codeLength =
    configuredLength != null && Number.isFinite(configuredLength) && configuredLength > 0
      ? configuredLength
      : DEFAULT_STRUCTURED_GL_CODE_LENGTH;

  return {
    enforceStructured: enforceConfiguration?.enabled === true,
    codeLength
  };
}
