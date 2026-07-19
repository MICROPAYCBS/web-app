'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ListPage } from '@/components/composites';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AboutUsPageContent() {
  return (
    <ListPage
      title="About us"
      description="The Mifos Initiative builds open technology for inclusive financial service providers."
    >
      <Card>
        <CardContent className="space-y-6 pt-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="font-heading text-base font-medium text-foreground">Who we are</h2>
            <p>
              The Mifos Initiative is a global community dedicated to financial inclusion. We help
              microfinance institutions, banks, and fintechs deliver affordable products to people
              traditionally excluded from formal finance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base font-medium text-foreground">Our mission</h2>
            <p>
              Accelerate the elimination of poverty by enabling financial service providers to
              implement low-cost, high-quality, and scalable solutions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base font-medium text-foreground">Our vision</h2>
            <p>
              A world where every person has access to affordable, high-quality financial services
              that help them build resilience and opportunity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-base font-medium text-foreground">Why open source</h2>
            <p>
              Open source keeps costs low, encourages local innovation, and lets institutions own
              their technology roadmap instead of being locked into proprietary vendors.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Transparent</strong> — inspect, audit, and adapt
                the stack to local regulation.
              </li>
              <li>
                <strong className="text-foreground">Affordable</strong> — reduce license fees and
                reinvest in client services.
              </li>
              <li>
                <strong className="text-foreground">Innovative</strong> — share improvements across
                the community.
              </li>
              <li>
                <strong className="text-foreground">Secure</strong> — many eyes on the code and
                freedom to harden deployments.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base">The ecosystem</CardTitle>
            </CardHeader>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Platform</strong> — core banking capabilities
                for accounts, loans, savings, and reporting.
              </li>
              <li>
                <strong className="text-foreground">Community</strong> — practitioners, developers,
                and volunteers who shape the roadmap.
              </li>
              <li>
                <strong className="text-foreground">Certified partners</strong> — implementers who
                deliver hosted and on-premise solutions.
              </li>
              <li>
                <strong className="text-foreground">Foundation</strong> — governance and stewardship
                of the open-source assets.
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </ListPage>
  );
}
