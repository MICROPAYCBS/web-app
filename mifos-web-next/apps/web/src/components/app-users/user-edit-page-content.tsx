'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserDetail, FineractUserTemplate } from '@mifos/api-client';
import { userWizardDraftFromUser } from '@/components/app-users/wizard/draft';
import { UserWizard } from '@/components/app-users/wizard/user-wizard';

export function UserEditPageContent({
  user,
  template
}: {
  user: FineractUserDetail;
  template: FineractUserTemplate;
}) {
  return (
    <UserWizard
      mode="edit"
      template={template}
      initialDraft={userWizardDraftFromUser(user)}
      userId={user.id}
    />
  );
}
