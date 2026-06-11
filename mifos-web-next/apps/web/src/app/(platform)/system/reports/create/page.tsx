/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ReportWizard } from '@/components/system/report-wizard/report-wizard';
import { initialReportWizardDraft } from '@/lib/fineract/report-display';
import { getReportTemplate } from '@/lib/fineract/reports';
import { getServerSession } from '@/lib/session/server';

export default async function CreateReportPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.reports')) || !can(session, 'CREATE_REPORT')) {
    notFound();
  }

  const template = await getReportTemplate();
  const initialDraft = initialReportWizardDraft(undefined, template);

  return <ReportWizard mode="create" template={template} initialDraft={initialDraft} />;
}
