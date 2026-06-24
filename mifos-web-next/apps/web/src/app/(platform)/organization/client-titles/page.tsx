/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { CUSTOMER_TITLE_LIST_PATH } from '@/lib/fineract/customer-title-paths';

/** Legacy route — customer titles moved from client-titles. */
export default function OrganizationClientTitlesRedirectPage() {
  redirect(CUSTOMER_TITLE_LIST_PATH);
}
