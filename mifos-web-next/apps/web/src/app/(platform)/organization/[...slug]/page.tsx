/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { RegistryRoutePage } from '@/components/platform/registry-route-page';
import { pathnameFromSlug } from '@/lib/routes/pathname-from-slug';

export default async function OrganizationSlugPage({
  params
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  return <RegistryRoutePage pathname={pathnameFromSlug('/organization', slug)} />;
}
