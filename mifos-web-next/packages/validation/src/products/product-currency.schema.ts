/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

/**
 * Fineract omits `inMultiplesOf` when unset. Legacy web-app treats blank as absent
 * and requires a minimum of 1 when the field is filled in.
 */
export const optionalInMultiplesOf = z
  .union([z.literal(''), z.coerce.number().int().min(1, 'Must be at least 1.')])
  .optional()
  .transform((value) => (value === '' || value === undefined ? undefined : value));
