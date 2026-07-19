/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ClientAccountCreatePlaceholder } from '@/components/clients/detail/client-account-create-placeholder';

export default async function NewShareAccountPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return <ClientAccountCreatePlaceholder clientId={clientId} kind="share" />;
}
