/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { GroupGeneralSections } from '@/components/groups/group-general-sections';
import { getGroup, getGroupAccounts, getGroupSummary } from '@/lib/fineract/groups';

export default async function GroupGeneralPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const [group, summary, accounts] = await Promise.all([
    getGroup(groupId),
    getGroupSummary(groupId),
    getGroupAccounts(groupId)
  ]);

  if (!group) {
    return null;
  }

  return (
    <GroupGeneralSections
      group={group}
      summary={summary}
      savingsAccounts={accounts.savingsAccounts}
      loanAccounts={accounts.loanAccounts}
    />
  );
}
