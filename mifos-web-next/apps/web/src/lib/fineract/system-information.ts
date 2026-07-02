import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { APP_VERSION } from '@/lib/app-version';
import { probeFineractServer } from '@/lib/fineract/probe-server';
import { getFineractServerConfig } from '@/lib/fineract/server-config';

export interface SystemInformationSnapshot {
  tenantId: string;
  serverName: string;
  serverBaseUrl: string;
  applicationVersion: string;
  coreBankingRelease: string | null;
  coreBankingCommit: string | null;
  coreBankingVersionNote: string | null;
}

export async function getSystemInformation(): Promise<SystemInformationSnapshot> {
  const { baseUrl, tenantId, serverName } = await getFineractServerConfig();
  const probe = await probeFineractServer(baseUrl);

  return {
    tenantId,
    serverName,
    serverBaseUrl: baseUrl,
    applicationVersion: APP_VERSION,
    coreBankingRelease: probe.release ?? probe.version ?? null,
    coreBankingCommit: probe.commit ?? null,
    coreBankingVersionNote:
      probe.release == null && probe.version == null && probe.message ? probe.message : null
  };
}
