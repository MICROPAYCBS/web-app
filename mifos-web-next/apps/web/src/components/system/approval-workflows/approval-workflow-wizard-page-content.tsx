'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApprovalWorkflowWizard } from '@/components/system/approval-workflows/wizard/approval-workflow-wizard';
import type { ApprovalWorkflowWizardProps } from '@/components/system/approval-workflows/wizard/types';

export function ApprovalWorkflowWizardPageContent(props: ApprovalWorkflowWizardProps) {
  return <ApprovalWorkflowWizard {...props} />;
}
