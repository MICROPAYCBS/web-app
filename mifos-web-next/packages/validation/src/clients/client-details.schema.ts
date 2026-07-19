/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export {
  clientIdentifierSchema,
  type ClientIdentifierInput
} from './client-identifier.schema';

export const clientDocumentMetadataSchema = z.object({
  name: z.string().trim().min(1).max(250),
  description: z.string().trim().max(500).optional()
});

export const clientNoteSchema = z.object({
  note: z.string().trim().min(1).max(65535)
});

export type ClientDocumentMetadataInput = z.infer<typeof clientDocumentMetadataSchema>;
export type ClientNoteInput = z.infer<typeof clientNoteSchema>;
