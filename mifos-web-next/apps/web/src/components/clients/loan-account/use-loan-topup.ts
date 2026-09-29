'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientActiveLoanOption, ClientLoanAccountTemplate } from '@mifos/api-client';
import { useEffect, useMemo, useState } from 'react';
import {
  loadLoanTopupContextAction,
  loadPendingTopupClosuresAction
} from '@/actions/loan-topup';
import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';
import { parseFineractDateString } from '@/lib/fineract/dates';
import { loanAccountChargeMetadata } from '@/lib/fineract/loan-application-charges';
import {
  activeLoanOptionLabel,
  activeLoansForTopup,
  buildLoanTopupFieldErrors,
  estimateApplicationDisbursementCharges,
  loanTopupSectionVisible,
  topupCashToClient,
  type LoanTopupContext,
  type PendingTopupClosure,
  type TopupChargeInput
} from '@/lib/fineract/loan-topup';

export function useLoanTopupQuote(
  loanId: number | undefined,
  transactionDate: string,
  enabled: boolean
) {
  const [context, setContext] = useState<LoanTopupContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || loanId == null || loanId <= 0) {
      setContext(null);
      setFailed(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    const date = parseFineractDateString(transactionDate) ? transactionDate.trim() : '';
    void loadLoanTopupContextAction(loanId, date).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setContext(null);
        setFailed(true);
        return;
      }
      setContext(result.context);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, loanId, transactionDate]);

  return { context, loading, failed };
}

export function useLoanTopup({
  clientId,
  excludeLoanId,
  template,
  draft
}: {
  clientId: string;
  excludeLoanId?: number;
  template: ClientLoanAccountTemplate;
  draft: LoanAccountDraft;
}) {
  const clientNumber = Number(clientId);
  const visible =
    loanTopupSectionVisible(template.canUseForTopup, clientNumber) ||
    (draft.isTopup === true && Number.isFinite(clientNumber) && clientNumber > 0);
  const options = useMemo(
    () => activeLoansForTopup(template.clientActiveLoanOptions, template.currency?.code),
    [template.clientActiveLoanOptions, template.currency?.code]
  );
  const [context, setContext] = useState<LoanTopupContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextFailed, setContextFailed] = useState(false);
  const [pending, setPending] = useState<PendingTopupClosure[]>([]);

  useEffect(() => {
    if (!visible) {
      setPending([]);
      return;
    }
    let cancelled = false;
    void loadPendingTopupClosuresAction(clientId, excludeLoanId).then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      setPending(result.pending);
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, excludeLoanId, visible]);

  const loanIdToClose = draft.isTopup === true ? draft.loanIdToClose : undefined;
  const quoteDate = draft.expectedDisbursementDate?.trim() ?? '';

  useEffect(() => {
    if (!visible || draft.isTopup !== true || loanIdToClose == null || loanIdToClose <= 0) {
      setContext(null);
      setContextFailed(false);
      setContextLoading(false);
      return;
    }
    let cancelled = false;
    setContextLoading(true);
    setContextFailed(false);
    const date = parseFineractDateString(quoteDate) ? quoteDate : '';
    void loadLoanTopupContextAction(loanIdToClose, date).then((result) => {
      if (cancelled) {
        return;
      }
      setContextLoading(false);
      if (!result.ok) {
        setContext(null);
        setContextFailed(true);
        return;
      }
      setContext(result.context);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.isTopup, loanIdToClose, quoteDate, visible]);

  const chargeInputs = useMemo<TopupChargeInput[]>(() => {
    return (draft.charges ?? []).map((charge) => {
      const meta = loanAccountChargeMetadata(template, charge.chargeId);
      return {
        amount: charge.amount,
        chargeTimeTypeId: meta?.chargeTimeType?.id,
        chargeTimeTypeCode: meta?.chargeTimeType?.code,
        calculationTypeId: meta?.chargeCalculationType?.id
      };
    });
  }, [draft.charges, template]);

  const disbursementCharges = useMemo(
    () => estimateApplicationDisbursementCharges(chargeInputs, draft.principal),
    [chargeInputs, draft.principal]
  );

  const fieldErrors = useMemo(
    () =>
      buildLoanTopupFieldErrors({
        isTopup: visible && draft.isTopup === true,
        loanIdToClose: draft.loanIdToClose,
        close: context,
        closeFailed: contextFailed,
        productCurrencyCode: template.currency?.code,
        payoffAmount: context?.payoff?.amount,
        principal: draft.principal,
        submittedOnDate: draft.submittedOnDate,
        expectedDisbursementDate: draft.expectedDisbursementDate
      }),
    [
      context,
      contextFailed,
      draft.expectedDisbursementDate,
      draft.isTopup,
      draft.loanIdToClose,
      draft.principal,
      draft.submittedOnDate,
      template.currency?.code,
      visible
    ]
  );

  const cashToClient =
    draft.isTopup === true && context?.payoff
      ? topupCashToClient(draft.principal, context.payoff.amount, disbursementCharges.total)
      : null;

  const pendingMatch =
    draft.isTopup === true && draft.loanIdToClose != null
      ? pending.find((item) => item.closureLoanId === draft.loanIdToClose)
      : undefined;

  const selectedOption = options.find((option) => option.id === draft.loanIdToClose);

  return {
    visible,
    options,
    optionLabel: (option: ClientActiveLoanOption) => activeLoanOptionLabel(option),
    selectedLabel:
      selectedOption != null
        ? activeLoanOptionLabel(selectedOption)
        : context?.accountNo
          ? [context.accountNo, context.productName, context.currencyCode].filter(Boolean).join(' · ')
          : draft.loanIdToClose
            ? `Loan ${draft.loanIdToClose}`
            : undefined,
    context,
    loading: contextLoading,
    fieldErrors,
    cashToClient,
    omittedInterestBased: disbursementCharges.omittedInterestBased,
    pendingWarning: pendingMatch
      ? `This customer already has a pending top-up (${pendingMatch.accountNo}) for this loan. Disbursing both will fail because the loan will no longer be active.`
      : null
  };
}
