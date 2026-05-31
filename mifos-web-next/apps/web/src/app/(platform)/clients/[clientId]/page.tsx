/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DateValue,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection,
  DetailSummary,
  MoneyValue,
  PercentValue,
  TextValue
} from '@/components/composites';
import { ComingSoonPage } from '@/components/platform/coming-soon-page';

/** Placeholder until BFF loads `GET /clients/:id`. */
function demoClient(clientId: string) {
  return {
    id: clientId,
    displayName: 'Jane Wanjiku',
    status: 'Active',
    accountNo: '000000042',
    office: 'Head Office',
    staff: 'Loan Officer A',
    currencyCode: 'KES',
    loanCycle: 2,
    activeLoans: 1,
    totalOutstanding: 125_000.5,
    activeSavings: 1,
    savingsBalance: 48_500,
    activationDate: '2024-03-15',
    submittedDate: '2024-03-10',
    annualRate: 12.5
  };
}

export default async function ClientDetailPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = demoClient(clientId);
  const useDemo = process.env.NODE_ENV === 'development';

  if (!useDemo) {
    return (
      <ComingSoonPage
        title={`Client ${clientId}`}
        description="Client detail will load from Fineract via the BFF. Demo layout is available in development."
      />
    );
  }

  return (
    <DetailPage
      header={
        <DetailHeader
          title={client.displayName}
          status={{ label: client.status, variant: 'secondary' }}
          meta={
            <span>
              Client no. {client.accountNo} · {client.office} · Staff: {client.staff}
            </span>
          }
          actions={
            <Button type="button" variant="outline" disabled>
              Actions
            </Button>
          }
        />
      }
      summary={
        <DetailSummary
          items={[
            {
              id: 'outstanding',
              label: 'Total loan outstanding',
              value: (
                <MoneyValue
                  amount={client.totalOutstanding}
                  currencyCode={client.currencyCode}
                  emphasize
                />
              )
            },
            {
              id: 'savings',
              label: 'Savings balance',
              value: (
                <MoneyValue
                  amount={client.savingsBalance}
                  currencyCode={client.currencyCode}
                  emphasize
                />
              )
            },
            {
              id: 'loans',
              label: 'Active loans',
              value: <TextValue value={String(client.activeLoans)} />
            },
            {
              id: 'cycle',
              label: 'Loan cycle',
              value: <TextValue value={String(client.loanCycle)} />
            }
          ]}
        />
      }
    >
      <DetailSection title="Identifiers" description="Office and account references.">
        <DetailFieldGrid>
          <DetailField label="Client ID">
            <TextValue value={client.id} />
          </DetailField>
          <DetailField label="Account no.">
            <TextValue value={client.accountNo} />
          </DetailField>
          <DetailField label="Office">
            <TextValue value={client.office} />
          </DetailField>
          <DetailField label="Staff">
            <TextValue value={client.staff} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Performance" description="Summary figures for lending and savings.">
        <DetailFieldGrid>
          <DetailField label="Loan cycle">
            <TextValue value={String(client.loanCycle)} />
          </DetailField>
          <DetailField label="Active loans">
            <TextValue value={String(client.activeLoans)} />
          </DetailField>
          <DetailField label="Total outstanding" valueClassName="text-right">
            <MoneyValue amount={client.totalOutstanding} currencyCode={client.currencyCode} />
          </DetailField>
          <DetailField label="Active savings">
            <TextValue value={String(client.activeSavings)} />
          </DetailField>
          <DetailField label="Savings balance" valueClassName="text-right">
            <MoneyValue amount={client.savingsBalance} currencyCode={client.currencyCode} />
          </DetailField>
          <DetailField label="Illustrative rate" valueClassName="text-right">
            <PercentValue value={client.annualRate} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Dates">
        <DetailFieldGrid columns={2}>
          <DetailField label="Submitted on">
            <DateValue value={client.submittedDate} />
          </DetailField>
          <DetailField label="Activation date">
            <DateValue value={client.activationDate} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <p className="text-sm text-muted-foreground">
        <Link href="/clients" className="underline underline-offset-4">
          Back to clients
        </Link>
        {' · '}
        Development preview using ADR-013 detail composites.
      </p>
    </DetailPage>
  );
}
