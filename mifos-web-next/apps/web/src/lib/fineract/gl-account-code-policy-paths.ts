/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const ENFORCE_STRUCTURED_GL_CODES_CONFIG_NAME = 'enforce-structured-gl-codes';
export const STRUCTURED_GL_CODE_LENGTH_CONFIG_NAME = 'structured-gl-code-length';
export const DEFAULT_STRUCTURED_GL_CODE_LENGTH = 6;

export type StructuredGlCodePolicy = {
  enforceStructured: boolean;
  codeLength: number;
};
