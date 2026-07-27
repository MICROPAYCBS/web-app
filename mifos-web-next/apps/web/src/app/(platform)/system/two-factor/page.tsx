/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { TwoFactorConfigurationPageContent } from '@/components/system/twofactor-configuration-page-content';
import {
  getTwoFactorConfiguration,
  isTwoFactorConfigurationUnavailable
} from '@/lib/fineract/twofactor-configuration';
import { getServerSession } from '@/lib/session/server';

export default async function TwoFactorConfigurationPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.twoFactor'))) {
    notFound();
  }

  let configuration = null;
  let unavailableMessage: string | null = null;

  try {
    configuration = await getTwoFactorConfiguration();
  } catch (error) {
    if (isTwoFactorConfigurationUnavailable(error)) {
      unavailableMessage =
        'Two-factor authentication is turned off on the connected server, or the configure API is unavailable.';
    } else {
      throw error;
    }
  }

  const canUpdate = can(session, resolvePermission('system.twoFactor.update'));

  return (
    <TwoFactorConfigurationPageContent
      configuration={configuration}
      canUpdate={canUpdate}
      unavailableMessage={unavailableMessage}
    />
  );
}
