'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyDetail } from '@mifos/api-client';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { isSurveyActive } from '@/lib/fineract/survey-display';
import { cn } from '@/lib/utils';

export function SurveyDetailView({
  survey,
  canUpdate
}: {
  survey: FineractSurveyDetail;
  canUpdate: boolean;
}) {
  const active = isSurveyActive(survey.validFrom, survey.validTo);

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/system/surveys" label="Back to surveys" />}
          title={survey.name}
          status={
            active
              ? { label: 'Active', variant: 'default' }
              : { label: 'Inactive', variant: 'secondary' }
          }
          meta={`Survey key: ${survey.key}`}
          actions={
            canUpdate ? (
              <Link
                href={`/system/surveys/${survey.id}/edit`}
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            ) : null
          }
        />
      }
      summary={
        <DetailFieldGrid columns={2}>
          <DetailField label="Key">{survey.key}</DetailField>
          <DetailField label="Country code">{survey.countryCode || '—'}</DetailField>
          <DetailField label="Description">{survey.description || '—'}</DetailField>
          <DetailField label="Valid from">{survey.validFrom || '—'}</DetailField>
          <DetailField label="Valid to">{survey.validTo || '—'}</DetailField>
        </DetailFieldGrid>
      }
    >
      <div className="space-y-6">
        {survey.questionDatas.length ? (
          survey.questionDatas.map((question, index) => (
            <div
              key={`${question.key}-${question.sequenceNo}`}
              className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <div>
                <h3 className="text-sm font-medium">
                  Question {index + 1}: {question.text}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Key: {question.key}
                  {question.description ? ` · ${question.description}` : ''}
                </p>
              </div>

              {question.responseDatas.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Text</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {question.responseDatas.map((response) => (
                      <TableRow key={`${response.sequenceNo}-${response.text}`}>
                        <TableCell>{response.sequenceNo}</TableCell>
                        <TableCell>{response.text}</TableCell>
                        <TableCell>{response.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No response options configured.</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No questions configured for this survey.</p>
        )}
      </div>
    </DetailPage>
  );
}
