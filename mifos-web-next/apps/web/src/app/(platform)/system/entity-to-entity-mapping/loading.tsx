/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DetailPageSkeleton } from '@/components/composites/detail-page-skeleton';

export default function EntityToEntityMappingLoading() {
  return (
    <DetailPageSkeleton
      showAvatar={false}
      sidebarItemCount={6}
      contentSectionCount={1}
      tableSection
    />
  );
}
