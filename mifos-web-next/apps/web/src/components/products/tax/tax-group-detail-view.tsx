'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxGroupDetail } from '@mifos/api-client';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import { formatTaxDate } from '@/lib/fineract/tax-display';
import { taxGroupEditPath, taxGroupsListPath } from '@/lib/fineract/tax-paths';
import { cn } from '@/lib/utils';

export function TaxGroupDetailView({
  group,
  canEdit
}: {
  group: TaxGroupDetail;
  canEdit: boolean;
}) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href={taxGroupsListPath()} label="Back to tax groups" />}
          title={group.name ?? `Tax group #${group.id}`}
          actions={
            canEdit ? (
              <Link
                href={taxGroupEditPath(group.id)}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <Pencil className="mr-1 size-4" />
                Edit
              </Link>
            ) : null
          }
        />
      }
    >
      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Name">{group.name ?? '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>
      <DetailSection title="Tax components">
        {group.taxAssociations.length ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Component</th>
                  <th className="px-3 py-2 text-left font-medium">Start date</th>
                  <th className="px-3 py-2 text-left font-medium">End date</th>
                </tr>
              </thead>
              <tbody>
                {group.taxAssociations.map((association) => (
                  <tr key={association.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      {association.taxComponent.glCode
                        ? `${association.taxComponent.glCode} `
                        : ''}
                      {association.taxComponent.name ?? `Component #${association.taxComponent.id}`}
                    </td>
                    <td className="px-3 py-2">{formatTaxDate(association.startDate)}</td>
                    <td className="px-3 py-2">{formatTaxDate(association.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tax components in this group.</p>
        )}
      </DetailSection>
    </DetailPage>
  );
}
