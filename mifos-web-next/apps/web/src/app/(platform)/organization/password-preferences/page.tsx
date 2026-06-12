/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { PasswordPreferencesPageContent } from '@/components/organization/password-preferences-page-content';
import { getPasswordPreferencesTemplate } from '@/lib/fineract/password-preferences';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationPasswordPreferencesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.passwordPreferences'))) {
    notFound();
  }

  const preferences = await getPasswordPreferencesTemplate();
  const canUpdate = can(session, 'UPDATE_PASSWORD_VALIDATION_POLICY');

  return <PasswordPreferencesPageContent preferences={preferences} canUpdate={canUpdate} />;
}
