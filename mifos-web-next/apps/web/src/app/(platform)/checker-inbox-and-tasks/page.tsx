/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { CHECKER_INBOX_LIST_PATH } from '@/lib/fineract/checker-inbox-paths';

export default function CheckerInboxAndTasksPage(): never {
  redirect(CHECKER_INBOX_LIST_PATH);
}
