/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { EmptyValue } from '@/components/composites/detail/empty-value';

export function TextValue({ value }: { value: string | null | undefined }) {
  if (value == null || value.trim() === '') {
    return <EmptyValue />;
  }
  return <span>{value}</span>;
}
