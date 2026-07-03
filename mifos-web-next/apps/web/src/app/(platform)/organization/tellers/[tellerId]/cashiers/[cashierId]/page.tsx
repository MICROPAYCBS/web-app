/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CashierDetailView } from '@/components/organization/cashier-detail-view';
import { DetailBackLink, DetailHeader, DetailPage } from '@/components/composites';
import {
  assertCanViewCashier,
  canReadAllOrganizationCashiers,
  canViewOrganizationCashierRoute
} from '@/lib/fineract/cashier-access';
import {
  getOrganizationCashierSummary,
  listOrganizationCashiers
} from '@/lib/fineract/cashiers';
import { findCurrentUserCashierAssignment } from '@/lib/fineract/current-user-cashier';
import {
  getDefaultOrganizationCurrencyCode,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
import { getOrganizationTeller } from '@/lib/fineract/tellers';
import { tellerCashiersPath } from '@/lib/fineract/teller-paths';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationTellerCashierDetailPage({
  params
}: {
  params: Promise<{ tellerId: string; cashierId: string }>;
}) {
  const { tellerId, cashierId } = await params;
  const session = await getServerSession();

  if (!canViewOrganizationCashierRoute(session)) {
    notFound();
  }

  const readAllCashiers = canReadAllOrganizationCashiers(session);
  const canUpdate = can(session, 'UPDATECASHIERALLOCATION_TELLER');
  const canAllocate = can(session, 'ALLOCATECASHTOCASHIER_TELLER');
  const canSettle = can(session, 'SETTLECASHFROMCASHIER_TELLER');

  let teller;
  try {
    teller = await getOrganizationTeller(tellerId);
  } catch {
    notFound();
  }

  let cashier;
  if (readAllCashiers) {
    const cashiers = await listOrganizationCashiers(tellerId);
    cashier = cashiers.find((row) => String(row.id) === cashierId);
  } else if (session) {
    const assignment = await findCurrentUserCashierAssignment({
      userId: session.userId,
      officeId: session.officeId
    });
    if (
      assignment &&
      String(assignment.tellerId) === tellerId &&
      String(assignment.cashier.id) === cashierId
    ) {
      cashier = assignment.cashier;
    }
  }

  if (!cashier) {
    notFound();
  }

  try {
    await assertCanViewCashier(session, cashier);
  } catch {
    notFound();
  }

  const [currencies, defaultCurrencyCode] = await Promise.all([
    getOrganizationSelectedCurrencies(),
    getDefaultOrganizationCurrencyCode()
  ]);

  if (!defaultCurrencyCode) {
    return (
      <DetailPage
        header={
          <DetailHeader
            backLink={
              readAllCashiers ? (
                <DetailBackLink href={tellerCashiersPath(tellerId)} label="Back to cashiers" />
              ) : (
                <DetailBackLink href="/" label="Back to dashboard" />
              )
            }
            title="Cashier details"
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          Configure at least one organization currency before viewing cashier balances.
        </p>
      </DetailPage>
    );
  }

  let initialSummary;
  try {
    initialSummary = await getOrganizationCashierSummary(
      tellerId,
      cashierId,
      defaultCurrencyCode
    );
  } catch {
    notFound();
  }

  return (
    <CashierDetailView
      teller={teller}
      cashier={cashier}
      currencies={currencies}
      initialCurrencyCode={defaultCurrencyCode}
      initialSummary={initialSummary}
      canUpdate={readAllCashiers && canUpdate}
      canAllocate={canAllocate}
      canSettle={canSettle}
      showCashiersListBackLink={readAllCashiers}
    />
  );
}
