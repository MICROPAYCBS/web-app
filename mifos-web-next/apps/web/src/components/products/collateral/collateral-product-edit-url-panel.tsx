'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollateralProductDetail, CollateralProductTemplate } from '@mifos/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CollateralProductEditSheet } from '@/components/products/collateral/collateral-product-form';

/** Opens the edit side panel when the URL contains `?edit=1`. */
export function CollateralProductEditUrlPanel({
  product,
  template
}: {
  product: CollateralProductDetail;
  template: CollateralProductTemplate;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = searchParams.get('edit') === '1';

  function handleOpenChange(next: boolean) {
    if (!next && searchParams.get('edit') === '1') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  return (
    <CollateralProductEditSheet
      product={product}
      template={template}
      open={open}
      onOpenChange={handleOpenChange}
    />
  );
}
