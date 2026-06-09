/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import {

  createLoanAccountSchema,

  loanAccountCoreStepSchema,

  loanAccountFinancialStepSchema,

  loanAccountPayoutStepSchema,

  loanAccountSecurityStepSchema,

  loanAccountTimelineStepSchema

} from '@mifos/validation';

import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';



export type LoanAccountStepErrors = Record<string, string>;



function flattenIssues(

  issues: { path: (string | number)[]; message: string }[]

): LoanAccountStepErrors {

  const errors: LoanAccountStepErrors = {};

  for (const issue of issues) {

    const key = issue.path.join('.') || String(issue.path[0] ?? 'form');

    if (!errors[key]) {

      errors[key] = issue.message;

    }

  }

  return errors;

}



export function validateLoanAccountStep(

  stepId: string,

  draft: LoanAccountDraft

): LoanAccountStepErrors {

  if (stepId === 'core') {

    const parsed = loanAccountCoreStepSchema.safeParse(draft);

    return parsed.success ? {} : flattenIssues(parsed.error.issues);

  }

  if (stepId === 'financial') {

    const parsed = loanAccountFinancialStepSchema.safeParse(draft);

    return parsed.success ? {} : flattenIssues(parsed.error.issues);

  }

  if (stepId === 'timeline') {

    const parsed = loanAccountTimelineStepSchema.safeParse(draft);

    return parsed.success ? {} : flattenIssues(parsed.error.issues);

  }

  if (stepId === 'security') {

    const parsed = loanAccountSecurityStepSchema.safeParse(draft);

    return parsed.success ? {} : flattenIssues(parsed.error.issues);

  }

  if (stepId === 'payout') {

    const parsed = loanAccountPayoutStepSchema.safeParse(draft);

    return parsed.success ? {} : flattenIssues(parsed.error.issues);

  }

  if (stepId === 'preview') {

    const parsed = createLoanAccountSchema.safeParse(draft);

    return parsed.success ? {} : flattenIssues(parsed.error.issues);

  }

  return {};

}

