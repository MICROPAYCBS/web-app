/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const clientContactSchema = z.object({
  contactTypeId: z.coerce.number().int().positive('Contact type is required'),
  contactValue: z.string().trim().min(1, 'Contact value is required').max(255),
  primary: z.boolean().optional()
});

export type ClientContactInput = z.infer<typeof clientContactSchema>;

export type ClientContactValidationContext = {
  contactTypeOptions?: Array<{
    id: number;
    example?: string;
    validationRegex?: string;
    typeName?: string;
  }>;
};

export function validateContactValueAgainstRegex(
  contactValue: string,
  validationRegex: string | undefined,
  typeName?: string,
  example?: string
): string | null {
  if (!validationRegex?.trim()) {
    return null;
  }
  try {
    if (!new RegExp(validationRegex).test(contactValue.trim())) {
      return (
        example?.trim() ||
        `Contact value does not match the required format${typeName ? ` for ${typeName}` : ''}.`
      );
    }
    return null;
  } catch {
    return 'Contact type validation regex is invalid.';
  }
}

export function validateClientContact(
  input: unknown,
  context: ClientContactValidationContext = {}
) {
  const parsed = clientContactSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  const selectedType = context.contactTypeOptions?.find(
    (option) => option.id === parsed.data.contactTypeId
  );
  const regexError = validateContactValueAgainstRegex(
    parsed.data.contactValue,
    selectedType?.validationRegex,
    selectedType?.typeName,
    selectedType?.example
  );

  if (regexError) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: regexError,
          path: ['contactValue']
        }
      ])
    };
  }

  return {
    success: true as const,
    data: {
      ...parsed.data,
      contactValue: parsed.data.contactValue.trim()
    }
  };
}
