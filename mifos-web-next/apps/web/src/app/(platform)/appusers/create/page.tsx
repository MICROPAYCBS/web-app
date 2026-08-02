/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { UserCreatePageContent } from '@/components/app-users/user-create-page-content';
import { getUserTemplate } from '@/lib/fineract/app-users';
import { getSmtpDeliveryConfigured } from '@/lib/fineract/external-services';
import { getServerSession } from '@/lib/session/server';

export default async function CreateAppUserPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.users')) || !can(session, 'CREATE_USER')) {
    notFound();
  }

  const [template, smtpConfigured] = await Promise.all([
    getUserTemplate(),
    getSmtpDeliveryConfigured()
  ]);

  return <UserCreatePageContent template={template} smtpConfigured={smtpConfigured} />;
}
