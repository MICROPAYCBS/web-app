'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalServiceProperty } from '@mifos/api-client';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DetailHeader, DetailPage, DetailSectionNav } from '@/components/composites';
import { ExternalServiceConfigTable } from '@/components/system/external-service-config-table';
import { ExternalServiceEditSheet } from '@/components/system/external-service-edit-sheet';
import { Button } from '@/components/ui/button';
import { useDetailSection } from '@/hooks/use-detail-section';
import {
  DEFAULT_EXTERNAL_SERVICE_SLUG,
  EXTERNAL_SERVICE_DEFINITIONS,
  type ExternalServiceSlug
} from '@/lib/fineract/external-service-display';

export function ExternalServicesView({
  configurations,
  canUpdate
}: {
  configurations: Record<ExternalServiceSlug, FineractExternalServiceProperty[]>;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const sectionIds = useMemo(
    () => EXTERNAL_SERVICE_DEFINITIONS.map((definition) => definition.slug),
    []
  );
  const { activeSection, setSection } = useDetailSection(sectionIds, DEFAULT_EXTERNAL_SERVICE_SLUG);
  const activeSlug = activeSection as ExternalServiceSlug;
  const definition =
    EXTERNAL_SERVICE_DEFINITIONS.find((item) => item.slug === activeSlug) ??
    EXTERNAL_SERVICE_DEFINITIONS[0];
  const properties = configurations[definition.slug] ?? [];
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setEditOpen(false);
  }, [definition.slug]);

  const navItems = useMemo(
    () =>
      EXTERNAL_SERVICE_DEFINITIONS.map((item) => ({
        id: item.slug,
        label: item.title,
        icon: item.icon
      })),
    []
  );

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            title="External services"
            meta="Configure third-party integrations for storage, email, SMS, and push notifications."
          />
        }
        sidebar={
          <DetailSectionNav items={navItems} activeId={definition.slug} onSelect={setSection} />
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-medium">{definition.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
            </div>
            {canUpdate ? (
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-card shadow-sm">
            <ExternalServiceConfigTable definition={definition} properties={properties} />
          </div>
        </div>
      </DetailPage>

      {canUpdate ? (
        <ExternalServiceEditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          definition={definition}
          properties={properties}
          onSaved={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
