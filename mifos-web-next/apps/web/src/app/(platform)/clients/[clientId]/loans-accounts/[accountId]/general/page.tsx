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
import type { LoanAccountRelatedRecordsContext } from '@/components/clients/loan-account/loan-account-related-context';
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
import { listJournalEntriesForLoanAccount } from '@/lib/fineract/journal-entries';
import { getLoanAccount } from '@/lib/fineract/loan-accounts';
import { listLoanRescheduleRequests } from '@/lib/fineract/loan-reschedule';
import { loadAccountCashierForSession } from '@/lib/fineract/load-account-cashier';
import { loadApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-runtime';
import {
  loadLoanAccountPendingCheckerActions,
  resolveLoanPendingApprovalWorkflowContext
} from '@/lib/fineract/loan-account-pending-checker';
import { loadLoanAccountStandingInstructionContext } from '@/lib/fineract/load-loan-account-standing-instruction-context';
import { loadClientAccountBackLabel } from '@/lib/fineract/load-client-account-back-label';
import { loadReportOrganisationName } from '@/lib/fineract/load-report-organisation-name';
import { getLoanRepaymentPolicySettings } from '@/lib/fineract/loan-repayment-policy';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';
import { getLoanNotes } from '@/lib/fineract/loan-notes';
import { getLoanDocuments } from '@/lib/fineract/loan-documents';
import { getLoanCollaterals } from '@/lib/fineract/loan-collaterals';
import { getLoanGuarantors } from '@/lib/fineract/loan-guarantors';
import { getLoanAccountOriginators } from '@/lib/fineract/loan-account-originators';
import { getLoanInterestPauses } from '@/lib/fineract/loan-interest-pauses';
import {
  getLoanDelinquencyActions,
  getLoanDelinquencyTags
} from '@/lib/fineract/loan-delinquency-records';
import {
  loanAccountHasTermVariations,
  loanAccountIsActive
} from '@/lib/fineract/loan-account-display';

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
    addCollateral: can(session, resolvePermission('loans.collateral.create')),
    addGuarantor: can(session, resolvePermission('loans.guarantors.create')),
    attachOriginator: can(session, resolvePermission('loans.originators.attach')),
    foreclosure: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.foreclosure),
    waiveInterest: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.waiveinterest),
    writeOff: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.writeoff),
    close: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS.close),
    closeAsRescheduled: can(session, LOAN_TRANSACTION_COMMAND_PERMISSIONS['close-rescheduled']),
    reschedule: can(session, resolvePermission('loans.reschedule.create')),
    editVariableInstallments: can(session, resolvePermission('loans.schedule.adjust')),
    resetVariableInstallments: can(session, resolvePermission('loans.schedule.reset')),
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
  const canViewJournals = can(session, resolvePermission('accounting.journal'));

  if (CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {
    notFound();
  }

  const result = await tryFineractLoad(
    () => getLoanAccount(accountId),
    'Could not load loan account.'
  );

  if (!result.ok) {
    const customerBackLabel = await loadClientAccountBackLabel(clientId);
    return (
      <ListPage
        backLink={
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <DetailBackLink href={clientGeneralPath(clientId)} label={customerBackLabel} />
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

  const account = result.data;
  const canReadNotes = can(session, resolvePermission('loans.notes'));
  const canReadDocuments = can(session, resolvePermission('loans.documents'));
  const canCreateInterestPause = can(session, resolvePermission('loans.interest-pause.create'));
  const isActive = loanAccountIsActive(account);
  const showInterestPauses = loanAccountHasTermVariations(account) || (isActive && canCreateInterestPause);

  const [
    cashierSnapshot,
    reportOrgName,
    standingInstructions,
    repaymentPolicy,
    auditResult,
    journalResult,
    notesResult,
    documentsResult,
    collateralsResult,
    guarantorsResult,
    originatorsResult,
    delinquencyTagsResult,
    delinquencyActionsResult,
    interestPausesResult
  ] = await Promise.all([
    loadAccountCashierForSession(session, {
      accountId: account.id,
      accountKind: 'loan',
      currencyCode: account.currency.code ?? 'USD'
    }),
    loadReportOrganisationName(),
    loadLoanAccountStandingInstructionContext(session, clientId, account),
    getLoanRepaymentPolicySettings(),
    tryFineractLoad(
      () => listAuditTrailsForLoanAccount(accountId, { limit: canViewAudits ? 100 : 25 }),
      'Could not load audit trail.'
    ),
    canViewJournals
      ? tryFineractLoad(
          () => listJournalEntriesForLoanAccount(accountId),
          'Could not load journal entries.'
        )
      : Promise.resolve(null),
    canReadNotes
      ? tryFineractLoad(() => getLoanNotes(account.id), 'Could not load notes.')
      : Promise.resolve(null),
    canReadDocuments
      ? tryFineractLoad(() => getLoanDocuments(account.id), 'Could not load documents.')
      : Promise.resolve(null),
    tryFineractLoad(() => getLoanCollaterals(account.id), 'Could not load collateral.'),
    tryFineractLoad(() => getLoanGuarantors(account.id), 'Could not load guarantors.'),
    tryFineractLoad(() => getLoanAccountOriginators(account.id), 'Could not load originators.'),
    isActive
      ? tryFineractLoad(() => getLoanDelinquencyTags(account.id), 'Could not load delinquency tags.')
      : Promise.resolve(null),
    isActive
      ? tryFineractLoad(
          () => getLoanDelinquencyActions(account.id),
          'Could not load delinquency actions.'
        )
      : Promise.resolve(null),
    showInterestPauses
      ? tryFineractLoad(() => getLoanInterestPauses(account.id), 'Could not load interest pauses.')
      : Promise.resolve(null)
  ]);

  const auditEntriesForPending =
    auditResult?.ok && auditResult.data ? auditResult.data.pageItems : [];
  const auditEntries = canViewAudits ? auditEntriesForPending : [];
  const auditTotalRecords =
    canViewAudits && auditResult?.ok && auditResult.data
      ? auditResult.data.totalFilteredRecords
      : undefined;

  const journalEntries =
    canViewJournals && journalResult?.ok && journalResult.data
      ? journalResult.data.pageItems
      : [];
  const journalTotalRecords =
    canViewJournals && journalResult?.ok && journalResult.data
      ? journalResult.data.totalFilteredRecords
      : undefined;

  const pendingCheckerActions = await loadLoanAccountPendingCheckerActions(
    account.id,
    auditEntriesForPending
  );

  const workflowRuntime = await loadApprovalWorkflowRuntimeContext();
  const pendingApprovalWorkflowContext = await resolveLoanPendingApprovalWorkflowContext(
    pendingCheckerActions,
    account,
    workflowRuntime
  );

  const permissions = loanAccountPermissions(session);
  const canReadReschedules = can(session, resolvePermission('loans.reschedule'));
  const rescheduleResult = canReadReschedules
    ? await tryFineractLoad(
        () => listLoanRescheduleRequests(account.id),
        'Could not load reschedule requests.'
      )
    : null;
  const reschedules = canReadReschedules
    ? {
        requests: rescheduleResult?.ok ? rescheduleResult.data : [],
        canCreate: permissions.reschedule,
        canApprove: can(session, resolvePermission('loans.reschedule.approve')),
        canReject: can(session, resolvePermission('loans.reschedule.reject'))
      }
    : null;

  const statusValue = account.status.value ?? '';
  const canEditTranches =
    account.multiDisburseLoan === true &&
    permissions.modifyApplication &&
    (statusValue === 'Submitted and pending approval' || statusValue === 'Approved');

  const relatedRecords: LoanAccountRelatedRecordsContext = {
    notes: canReadNotes
      ? {
          items: notesResult?.ok ? notesResult.data : [],
          canCreate: can(session, resolvePermission('loans.notes.create')),
          canUpdate: can(session, resolvePermission('loans.notes.update')),
          canDelete: can(session, resolvePermission('loans.notes.delete'))
        }
      : null,
    documents: {
      items: documentsResult?.ok ? documentsResult.data : [],
      canCreate: can(session, resolvePermission('loans.documents.create')),
      canDelete: can(session, resolvePermission('loans.documents.delete'))
    },
    collateral: {
      items: collateralsResult?.ok ? collateralsResult.data : [],
      canCreate: permissions.addCollateral && statusValue === 'Submitted and pending approval'
    },
    guarantors: {
      items: guarantorsResult?.ok ? guarantorsResult.data : [],
      canCreate: permissions.addGuarantor,
      canUpdate: can(session, resolvePermission('loans.guarantors.update')),
      canDelete: can(session, resolvePermission('loans.guarantors.delete'))
    },
    originators: {
      items: originatorsResult?.ok ? originatorsResult.data : [],
      canAttach:
        permissions.attachOriginator && statusValue === 'Submitted and pending approval',
      canDetach:
        can(session, resolvePermission('loans.originators.detach')) &&
        statusValue === 'Submitted and pending approval'
    },
    delinquency: isActive
      ? {
          tags: delinquencyTagsResult?.ok ? delinquencyTagsResult.data : [],
          actions: delinquencyActionsResult?.ok ? delinquencyActionsResult.data : [],
          canPause: can(session, resolvePermission('loans.delinquency-action.create'))
        }
      : null,
    interestPauses: showInterestPauses
      ? {
          items: interestPausesResult?.ok ? interestPausesResult.data : [],
          canManage: canCreateInterestPause
        }
      : null,
    canEditTranches
  };

  return (
    <LoanAccountDetailView
      account={account}
      clientId={clientId}
      permissions={permissions}
      repaymentPolicy={repaymentPolicy}
      cashierSnapshot={cashierSnapshot}
      reportOrgName={reportOrgName}
      standingInstructions={standingInstructions}
      reschedules={reschedules}
      relatedRecords={relatedRecords}
      canViewAudits={canViewAudits}
      auditEntries={auditEntries}
      auditLoadFailed={canViewAudits && auditResult != null && !auditResult.ok}
      auditTotalRecords={auditTotalRecords}
      canViewJournals={canViewJournals}
      journalEntries={journalEntries}
      journalLoadFailed={canViewJournals && journalResult != null && !journalResult.ok}
      journalTotalRecords={journalTotalRecords}
      pendingCheckerActions={pendingCheckerActions}
      pendingApprovalWorkflowContext={pendingApprovalWorkflowContext}
      makerCheckerTaskPermissions={workflowRuntime.makerCheckerPermissions}
    />
  );
}
