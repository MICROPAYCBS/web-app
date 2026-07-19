/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const templateMapperSchema = z.object({
  id: z.number().int().positive().optional(),
  mappersorder: z.number().int().min(0),
  mapperskey: z.string().trim().min(1, 'Mapper key is required.'),
  mappersvalue: z.string().trim().min(1, 'Mapper value is required.')
});

export const upsertTemplateFormSchema = z.object({
  entity: z.number().int().min(0, 'Entity is required.'),
  type: z.number().int().min(0, 'Type is required.'),
  name: z.string().trim().min(1, 'Name is required.'),
  text: z.string().trim().min(1, 'Template text is required.'),
  mappers: z.array(templateMapperSchema).default([])
});

export type TemplateMapperInput = z.infer<typeof templateMapperSchema>;
export type UpsertTemplateFormInput = z.infer<typeof upsertTemplateFormSchema>;

export function validateUpsertTemplateForm(input: unknown) {
  return upsertTemplateFormSchema.safeParse(input);
}

export function buildTemplateApiPayload(input: UpsertTemplateFormInput) {
  return {
    entity: input.entity,
    type: input.type,
    name: input.name.trim(),
    text: input.text,
    mappers: input.mappers.map((mapper) => ({
      ...(mapper.id != null ? { id: mapper.id } : {}),
      mappersorder: mapper.mappersorder,
      mapperskey: mapper.mapperskey.trim(),
      mappersvalue: mapper.mappersvalue.trim()
    }))
  };
}
