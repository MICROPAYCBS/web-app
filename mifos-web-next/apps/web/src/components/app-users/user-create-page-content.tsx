'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserTemplate } from '@mifos/api-client';
import { UserWizard } from '@/components/app-users/wizard/user-wizard';
import { defaultUserWizardDraft } from '@/components/app-users/wizard/draft';

export function UserCreatePageContent({
  template,
  smtpConfigured
}: {
  template: FineractUserTemplate;
  smtpConfigured: boolean;
}) {
  return (
    <UserWizard
      mode="create"
      template={template}
      initialDraft={defaultUserWizardDraft()}
      smtpConfigured={smtpConfigured}
    />
  );
}
