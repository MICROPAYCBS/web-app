/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Badge } from '@/components/ui/badge';
import { datatableRowKindLabel } from '@/lib/fineract/client-datatable-utils';

export function DatatableRowKindBadge({ multiRow }: { multiRow: boolean }) {
  return (
    <Badge variant="outline" className="font-normal">
      {datatableRowKindLabel(multiRow)}
    </Badge>
  );
}
