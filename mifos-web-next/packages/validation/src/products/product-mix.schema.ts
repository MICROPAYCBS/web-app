/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const restrictedProductsField = z
  .array(z.coerce.number().int().positive())
  .min(1, 'Select at least one restricted product.');

export const createProductMixSchema = z.object({
  productId: z.coerce.number().int().positive('Select a loan product.'),
  restrictedProducts: restrictedProductsField
});

export const updateProductMixSchema = z.object({
  restrictedProducts: restrictedProductsField
});

export type CreateProductMixInput = z.infer<typeof createProductMixSchema>;
export type UpdateProductMixInput = z.infer<typeof updateProductMixSchema>;
