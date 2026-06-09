'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ClientLoanAccountTemplate } from '@mifos/api-client';

import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';

import { DetailSection } from '@/components/composites';

import { MoneyValue } from '@/components/composites/detail/money-value';

import { fineractOptionLabel } from '@/lib/form/select-options';



function optionLabel(

  options: { id: number; value?: string; name?: string }[] | undefined,

  id: number

): string {

  const match = options?.find((option) => option.id === id);

  return match ? fineractOptionLabel(match) : String(id);

}



function namedOptionLabel(

  options: { id: number; name: string }[] | undefined,

  id: number | undefined

): string {

  if (id == null) {

    return '—';

  }

  return options?.find((option) => option.id === id)?.name ?? String(id);

}



const GUARANTOR_TYPE_LABELS: Record<number, string> = {

  1: 'Existing client',

  3: 'Staff',

  4: 'External entity'

};



export function LoanAccountPreviewStep({

  template,

  draft

}: {

  template: ClientLoanAccountTemplate;

  draft: LoanAccountDraft;

}) {

  const currencyCode = template.currency?.code ?? 'USD';

  const productName =

    template.productOptions?.find((option) => option.id === draft.productId)?.name ??

    template.product?.name ??

    '—';



  return (

    <div className="space-y-6">

      <p className="text-sm text-muted-foreground">

        Review the loan application before submitting.

      </p>

      <DetailSection title="Core product & context">

        <dl className="grid gap-3 text-sm sm:grid-cols-2">

          <div>

            <dt className="text-muted-foreground">Product</dt>

            <dd className="font-medium">{productName}</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Loan officer</dt>

            <dd className="font-medium">

              {template.loanOfficerOptions?.find((o) => o.id === draft.loanOfficerId)

                ?.displayName ?? '—'}

            </dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Loan purpose</dt>

            <dd className="font-medium">

              {namedOptionLabel(template.loanPurposeOptions, draft.loanPurposeId)}

            </dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Fund</dt>

            <dd className="font-medium">{namedOptionLabel(template.fundOptions, draft.fundId)}</dd>

          </div>

          {draft.externalId ? (

            <div>

              <dt className="text-muted-foreground">External ID</dt>

              <dd className="font-medium">{draft.externalId}</dd>

            </div>

          ) : null}

        </dl>

      </DetailSection>

      <DetailSection title="Financial terms">

        <dl className="grid gap-3 text-sm sm:grid-cols-2">

          <div>

            <dt className="text-muted-foreground">Principal</dt>

            <dd>

              <MoneyValue amount={draft.principal} currencyCode={currencyCode} />

            </dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Loan term</dt>

            <dd className="font-medium">

              {draft.loanTermFrequency}{' '}

              {optionLabel(template.termFrequencyTypeOptions, draft.loanTermFrequencyType)}

            </dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Repayments</dt>

            <dd className="font-medium">{draft.numberOfRepayments}</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Repay every</dt>

            <dd className="font-medium">

              {draft.repaymentEvery}{' '}

              {optionLabel(

                template.repaymentFrequencyTypeOptions,

                draft.repaymentFrequencyType

              )}

            </dd>

          </div>

        </dl>

      </DetailSection>

      <DetailSection title="Interest & timeline">

        <dl className="grid gap-3 text-sm sm:grid-cols-2">

          <div>

            <dt className="text-muted-foreground">Interest rate per period</dt>

            <dd className="font-medium">{draft.interestRatePerPeriod}%</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Submitted on</dt>

            <dd className="font-medium">{draft.submittedOnDate}</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Expected disbursement</dt>

            <dd className="font-medium">{draft.expectedDisbursementDate}</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Grace on principal</dt>

            <dd className="font-medium">{draft.graceOnPrincipalPayment ?? 0}</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Grace on interest payment</dt>

            <dd className="font-medium">{draft.graceOnInterestPayment ?? 0}</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Grace on interest charged</dt>

            <dd className="font-medium">{draft.graceOnInterestCharged ?? 0}</dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Strategy</dt>

            <dd className="font-medium">{draft.transactionProcessingStrategyCode}</dd>

          </div>

        </dl>

      </DetailSection>

      {(draft.collateral?.length ?? 0) > 0 || (draft.guarantors?.length ?? 0) > 0 ? (

        <DetailSection title="Collateral & guarantors">

          {(draft.collateral?.length ?? 0) > 0 ? (

            <div className="mb-4">

              <p className="mb-2 text-sm font-medium">Collateral</p>

              <ul className="space-y-2 text-sm">

                {draft.collateral?.map((item, index) => (

                  <li key={`collateral-preview-${index}`}>

                    {template.loanCollateralOptions?.find(

                      (option) => option.collateralId === item.collateralTypeId

                    )?.name ?? item.collateralTypeId}

                    {' · '}

                    Qty {item.value}

                  </li>

                ))}

              </ul>

            </div>

          ) : null}

          {(draft.guarantors?.length ?? 0) > 0 ? (

            <div>

              <p className="mb-2 text-sm font-medium">Guarantors</p>

              <ul className="space-y-2 text-sm">

                {draft.guarantors?.map((item, index) => (

                  <li key={`guarantor-preview-${index}`}>

                    {GUARANTOR_TYPE_LABELS[item.guarantorTypeId] ?? item.guarantorTypeId}

                    {item.entityId != null ? ` · ID ${item.entityId}` : ''}

                    {item.firstname ? ` · ${item.firstname} ${item.lastname ?? ''}` : ''}

                  </li>

                ))}

              </ul>

            </div>

          ) : null}

        </DetailSection>

      ) : null}

      <DetailSection title="Payout & automation">

        <dl className="grid gap-3 text-sm sm:grid-cols-2">

          <div>

            <dt className="text-muted-foreground">Linked savings account</dt>

            <dd className="font-medium">

              {template.accountLinkingOptions?.find((a) => a.id === draft.linkAccountId)

                ?.accountNo ?? '—'}

            </dd>

          </div>

          <div>

            <dt className="text-muted-foreground">Disburse to savings</dt>

            <dd className="font-medium">{draft.disburseToSavings ? 'Yes' : 'No'}</dd>

          </div>

        </dl>

      </DetailSection>

    </div>

  );

}

