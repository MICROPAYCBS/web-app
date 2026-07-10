/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { can, resolvePermission } from '@mifos/auth';

import { notFound } from 'next/navigation';

import { LoanAccountDetailView } from '@/components/clients/loan-account/loan-account-detail-view';

import type { LoanAccountActionPermissions } from '@/components/clients/loan-account/actions/loan-account-actions';

import { DetailBackLink } from '@/components/composites';

import { LoadErrorAlert } from '@/components/composites/load-error-alert';

import { ListPage } from '@/components/composites/list-page';

import { LOAN_OFFICER_CONFIG } from '@/lib/fineract/account-field-officer-config';

import {

  LOAN_DELETE_PERMISSION,

  LOAN_LIFECYCLE_COMMAND_PERMISSIONS,

  LOAN_TRANSACTION_COMMAND_PERMISSIONS

} from '@/lib/fineract/loan-account-command-meta';

import {

  CLIENT_ACCOUNT_RESERVED_IDS,

  clientGeneralPath

} from '@/lib/fineract/client-action-paths';

import { clientAccountListPath } from '@/lib/fineract/client-account-links';

import { listAuditTrailsForLoanAccount } from '@/lib/fineract/audit-trails';

import { getLoanAccount } from '@/lib/fineract/loan-accounts';

import { loadAccountCashierForSession } from '@/lib/fineract/load-account-cashier';

import { loadApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-runtime';
import { loadLoanAccountPendingCheckerActions, resolveLoanPendingApprovalWorkflowContext } from '@/lib/fineract/loan-account-pending-checker';

import { loadLoanAccountStandingInstructionContext } from '@/lib/fineract/load-loan-account-standing-instruction-context';

import { loadReportOrganisationName } from '@/lib/fineract/load-report-organisation-name';
import { getLoanRepaymentPolicySettings } from '@/lib/fineract/loan-repayment-policy';
import { tryFineractLoad } from '@/lib/fineract/safe-load';

import { getServerSession } from '@/lib/session/server';



function loanAccountPermissions(

  session: Awaited<ReturnType<typeof getServerSession>>

): LoanAccountActionPermissions {

  return {

    approve: can(session, LOAN_LIFECYCLE_COMMAND_PERMISSIONS.approve),

    reject: can(session, LOAN_LIFECYCLE_COMMAND_PERMISSIONS.reject),

    withdrawnByApplicant: can(session, LOAN_LIFECYCLE_COMMAND_PERMISSIONS.withdrawnByApplicant),

    deleteAccount: can(session, LOAN_DELETE_PERMISSION),

    undoApproval: can(session, LOAN_LIFECYCLE_COMMAND_PERMISSIONS.undoapproval),

    disburse: can(session, LOAN_LIFECYCLE_COMMAND_PERMISSIONS.disburse),

    disburseToSavings: can(session, LOAN_LIFECYCLE_COMMAND_PERMISSIONS.disbursetosavings),

    undoDisbursal: can(session, LOAN_LIFECYCLE_COMMAND_PERMISSIONS.undodisbursal),

    makeRepayment: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.repayment),

    addCharge: can(session, 'CREATE_LOANCHARGE'),

    foreclosure: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.foreclosure),

    waiveInterest: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.waiveinterest),

    writeOff: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.writeoff),

    close: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.close),

    closeAsRescheduled: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS['close-rescheduled']),

    recoveryPayment: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.recoverypayment),

    undoWriteOff: can(session, 'UNDOWRITEOFF_LOAN'),

    assignOfficer: can(session, LOAN_OFFICER_CONFIG.assignPermission),

    reassignOfficer: can(session, {
      all: [LOAN_OFFICER_CONFIG.assignPermission, LOAN_OFFICER_CONFIG.removePermission]
    }),

    repayFromSavings: can(session, 'CREATE_ACCOUNTTRANSFER'),

    modifyApplication: can(session, resolvePermission('loans.update'))

  };

}



export default async function LoanAccountGeneralPage({

  params

}: {

  params: Promise<{ clientId: string; accountId: string }>;

}) {

  const { clientId, accountId } = await params;

  const session = await getServerSession();

  const canViewAudits = can(session, resolvePermission('system.audit'));



  if (CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {

    notFound();

  }



  const result = await tryFineractLoad(

    () => getLoanAccount(accountId),

    'Could not load loan account.'

  );



  if (!result.ok) {

    return (

      <ListPage

        backLink={

          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">

            <DetailBackLink href={clientGeneralPath(clientId)} label="Back to customer" />

            <span className="text-muted-foreground" aria-hidden>

              ·

            </span>

            <DetailBackLink href={clientAccountListPath(clientId, 'loan')} label="Loans" />

          </div>

        }

        title="Loan account"

      >

        <LoadErrorAlert title="Could not load loan account" message={result.message} />

      </ListPage>

    );

  }



  if (!result.data) {

    notFound();

  }



  const [cashierSnapshot, reportOrgName, standingInstructions, repaymentPolicy, auditResult] =
    await Promise.all([
    loadAccountCashierForSession(session, {
      accountId: result.data.id,
      accountKind: 'loan',
      currencyCode: result.data.currency.code ?? 'USD'
    }),
    loadReportOrganisationName(),
    loadLoanAccountStandingInstructionContext(session, clientId, result.data),
    getLoanRepaymentPolicySettings(),
    tryFineractLoad(
      () => listAuditTrailsForLoanAccount(accountId, { limit: canViewAudits ? 100 : 25 }),
      'Could not load audit trail.'
    )
  ]);

  const auditEntriesForPending =
    auditResult?.ok && auditResult.data ? auditResult.data.pageItems : [];
  const auditEntries = canViewAudits ? auditEntriesForPending : [];
  const auditTotalRecords =
    canViewAudits && auditResult?.ok && auditResult.data
      ? auditResult.data.totalFilteredRecords
      : undefined;

  const pendingCheckerActions = await loadLoanAccountPendingCheckerActions(
    result.data.id,
    auditEntriesForPending
  );

  const workflowRuntime = await loadApprovalWorkflowRuntimeContext();
  const pendingApprovalWorkflowContext = await resolveLoanPendingApprovalWorkflowContext(
    pendingCheckerActions[0],
    result.data,
    workflowRuntime
  );

  return (

    <LoanAccountDetailView

      account={result.data}

      clientId={clientId}

      permissions={loanAccountPermissions(session)}

      repaymentPolicy={repaymentPolicy}

      cashierSnapshot={cashierSnapshot}

      reportOrgName={reportOrgName}

      standingInstructions={standingInstructions}

      canViewAudits={canViewAudits}

      auditEntries={auditEntries}

      auditLoadFailed={canViewAudits && auditResult != null && !auditResult.ok}

      auditTotalRecords={auditTotalRecords}

      pendingCheckerActions={pendingCheckerActions}

      pendingApprovalWorkflowContext={pendingApprovalWorkflowContext}

      makerCheckerTaskPermissions={workflowRuntime.makerCheckerPermissions}

    />

  );

}

