/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';
import { ADVANCED_GL_ACCOUNT_ENQUIRY_PATH } from '@/lib/fineract/advanced-gl-account-enquiry-query';

/** Renamed to GL account enquiry — preserve bookmarks. */
export default async function AdvancedGlAccountEnquiryRedirectPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.trim()) {
      query.set(key, value.trim());
    }
  }
  const qs = query.toString();
  redirect(qs ? `${ADVANCED_GL_ACCOUNT_ENQUIRY_PATH}?${qs}` : ADVANCED_GL_ACCOUNT_ENQUIRY_PATH);
  return null;
}
