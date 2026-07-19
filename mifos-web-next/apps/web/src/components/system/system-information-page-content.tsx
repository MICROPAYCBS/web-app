'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SystemInformationSnapshot } from '@/lib/fineract/system-information';
import { DetailField, DetailFieldGrid, ListPage, TextValue } from '@/components/composites';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SystemInformationPageContent({ info }: { info: SystemInformationSnapshot }) {
  return (
    <ListPage
      title="System information"
      description="Version and connection details for your active server."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailFieldGrid>
              <DetailField label="Tenant">
                <TextValue value={info.tenantId} />
              </DetailField>
              <DetailField label="Connected server">
                <TextValue value={info.serverName} />
              </DetailField>
              <DetailField label="Server URL">
                <TextValue value={info.serverBaseUrl} />
              </DetailField>
              <DetailField label="This application">
                <TextValue value={info.applicationVersion} />
              </DetailField>
              <DetailField label="Core banking release">
                <TextValue
                  value={
                    info.coreBankingRelease ?? info.coreBankingVersionNote ?? 'Version not reported'
                  }
                />
              </DetailField>
              {info.coreBankingCommit ? (
                <DetailField label="Build commit">
                  <TextValue value={info.coreBankingCommit} />
                </DetailField>
              ) : null}
            </DetailFieldGrid>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Software licensing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This application is distributed under the Mozilla Public License, version 2.0. Source
              code is available from the Mifos Initiative.
            </p>
            <p>
              The core banking platform is open source software. Your institution may run a
              supported distribution with additional modules, support, and compliance tooling.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Review license terms before modifying or redistributing components.</li>
              <li>Contributor agreements may apply when submitting changes upstream.</li>
              <li>Document third-party libraries added to custom deployments.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ListPage>
  );
}
