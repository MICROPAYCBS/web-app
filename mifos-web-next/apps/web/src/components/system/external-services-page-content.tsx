'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  EXTERNAL_SERVICE_DEFINITIONS,
  externalServicePath
} from '@/lib/fineract/external-service-display';
import { cn } from '@/lib/utils';

export function ExternalServicesPageContent() {
  return (
    <ListPage
      title="External services"
      description="Configure third-party integrations for storage, email, SMS, and push notifications."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {EXTERNAL_SERVICE_DEFINITIONS.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.slug}
              href={externalServicePath(service.slug)}
              className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full transition-colors group-hover:bg-muted/40">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                    <Icon className="size-5 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="text-base">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </div>
                  <ChevronRight
                    className={cn(
                      'mt-1 size-4 shrink-0 text-muted-foreground',
                      'transition-transform group-hover:translate-x-0.5'
                    )}
                    aria-hidden
                  />
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </ListPage>
  );
}
