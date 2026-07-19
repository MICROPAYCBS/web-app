/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CustomerClassesPageContent } from '@/components/organization/customer-classes-page-content';
import { getCustomerClassTemplate, listCustomerClasses } from '@/lib/fineract/customer-classes';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationCustomerClassesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.customerClasses'))) {
    notFound();
  }

  const [customerClasses, template] = await Promise.all([
    listCustomerClasses(),
    getCustomerClassTemplate()
  ]);

  return (
    <CustomerClassesPageContent
      customerClasses={customerClasses}
      template={template}
      canCreate={can(session, 'CREATE_CUSTOMERCLASS')}
      canEdit={can(session, 'UPDATE_CUSTOMERCLASS')}
      canDelete={can(session, 'DELETE_CUSTOMERCLASS')}
    />
  );
}
