/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BranchDetailView } from '@/components/organization/branch-detail-view';
import { BranchEditUrlPanel } from '@/components/organization/branch-edit-url-panel';
import { getOffice, getOfficeEditTemplate } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationOfficeDetailPage({
  params
}: {
  params: Promise<{ officeId: string }>;
}) {
  const { officeId } = await params;
  const session = await getServerSession();

  if (!can(session, resolvePermission('organization.offices'))) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_OFFICE');

  let office;
  let editTemplate;
  try {
    [office, editTemplate] = await Promise.all([
      getOffice(officeId),
      canEdit ? getOfficeEditTemplate(officeId) : Promise.resolve(null)
    ]);
  } catch {
    notFound();
  }

  const allowedParents = editTemplate?.allowedParents ?? [];
  const showParentField = allowedParents.length > 0;

  return (
    <>
      <BranchDetailView office={office} canEdit={canEdit} />
      {canEdit && editTemplate ? (
        <Suspense fallback={null}>
          <BranchEditUrlPanel
            officeId={editTemplate.id}
            parentOptions={allowedParents}
            showParentField={showParentField}
            initial={{
              name: editTemplate.name,
              parentId: editTemplate.parentId,
              openingDate: editTemplate.openingDate,
              externalId: editTemplate.externalId
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
