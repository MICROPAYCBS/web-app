/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const SYSTEM_DATATABLE_COLUMN_TYPES = [
  'Boolean',
  'Date',
  'Datetime',
  'Decimal',
  'Dropdown',
  'Number',
  'String',
  'Text'
] as const;

export type SystemDatatableColumnType = (typeof SYSTEM_DATATABLE_COLUMN_TYPES)[number];

const systemDatatableColumnTypeSchema = z.enum(SYSTEM_DATATABLE_COLUMN_TYPES);

const systemDatatableColumnSchema = z
  .object({
    name: z.string().trim().min(1, 'Column name is required'),
    type: systemDatatableColumnTypeSchema,
    mandatory: z.boolean(),
    unique: z.boolean().optional(),
    indexed: z.boolean().optional(),
    length: z.coerce.number().int().min(1).optional(),
    code: z.string().trim().optional(),
    validationRegex: z.string().trim().max(500).optional(),
    validationExample: z.string().trim().max(255).optional(),
    validationMessage: z.string().trim().max(500).optional()
  })
  .superRefine((column, ctx) => {
    if (column.type === 'String' && column.length == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Length is required for string columns',
        path: ['length']
      });
    }
    if (column.type === 'Dropdown' && !column.code?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Code is required for dropdown columns',
        path: ['code']
      });
    }
    if (column.validationRegex?.trim()) {
      try {
        // eslint-disable-next-line no-new -- validate regex at configuration time
        new RegExp(column.validationRegex);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Validation regex is invalid',
          path: ['validationRegex']
        });
      }
    }
  });

export const createSystemDatatableSchema = z
  .object({
    datatableName: z
      .string()
      .trim()
      .min(1, 'Data table name is required')
      .regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Use letters, numbers, and underscores'),
    apptableName: z.string().trim().min(1, 'Entity type is required'),
    multiRow: z.boolean().default(false),
    entitySubType: z.string().trim().optional(),
    columns: z.array(systemDatatableColumnSchema).min(1, 'Add at least one column')
  })
  .superRefine((value, ctx) => {
    const names = new Set<string>();
    for (const [index, column] of value.columns.entries()) {
      const key = column.name.toLowerCase();
      if (names.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Column names must be unique',
          path: ['columns', index, 'name']
        });
      }
      names.add(key);
    }
    if (value.apptableName === 'm_client' && value.entitySubType?.trim()) {
      const normalized = value.entitySubType.trim().toLowerCase();
      if (normalized !== 'person' && normalized !== 'entity') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sub type must be Person or Entity for customer data tables',
          path: ['entitySubType']
        });
      }
    }
  });

export const updateSystemDatatableChangeColumnSchema = z.object({
  name: z.string().trim().min(1),
  newName: z.string().trim().min(1).optional(),
  code: z.string().trim().optional(),
  newCode: z.string().trim().optional(),
  mandatory: z.boolean(),
  length: z.coerce.number().int().min(1).optional(),
  unique: z.boolean().optional(),
  indexed: z.boolean().optional()
});

export const updateSystemDatatableSchema = z
  .object({
    apptableName: z.string().trim().min(1),
    entitySubType: z.string().trim().optional(),
    addColumns: z.array(systemDatatableColumnSchema).optional(),
    changeColumns: z.array(updateSystemDatatableChangeColumnSchema).optional(),
    dropColumns: z.array(z.object({ name: z.string().trim().min(1) })).optional()
  })
  .superRefine((value, ctx) => {
    const hasChanges =
      (value.addColumns?.length ?? 0) > 0 ||
      (value.changeColumns?.length ?? 0) > 0 ||
      (value.dropColumns?.length ?? 0) > 0;
    if (!hasChanges) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'No column changes to save',
        path: ['addColumns']
      });
    }
  });

export type CreateSystemDatatableInput = z.infer<typeof createSystemDatatableSchema>;
export type UpdateSystemDatatableInput = z.infer<typeof updateSystemDatatableSchema>;
export type SystemDatatableColumnInput = z.infer<typeof systemDatatableColumnSchema>;

export function validateCreateSystemDatatable(input: unknown) {
  return createSystemDatatableSchema.safeParse(input);
}

export function validateUpdateSystemDatatable(input: unknown) {
  return updateSystemDatatableSchema.safeParse(input);
}
