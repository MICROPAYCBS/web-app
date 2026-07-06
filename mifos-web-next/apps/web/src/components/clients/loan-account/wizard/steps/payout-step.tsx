'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import { loanApplicationLinkedSavingsReasons } from '@mifos/validation';
import { useMemo } from 'react';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import type { LoanAccountDraft } from '@/lib/fineract/client-loan-account-draft';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  LOAN_ACCOUNT_LINK_SAVINGS_HINT,
  LOAN_ACCOUNT_STANDING_INSTRUCTION_AT_DISBURSEMENT_HINT
} from '@/lib/fineract/loan-account-field-hints';
import { draftHasAccountTransferCharge } from '@/lib/fineract/loan-application-charges';
import type { LoanAccountStepErrors } from '../validation';

export function LoanAccountPayoutStep({
  template,
  draft,
  errors,
  onChange
}: {
  template: ClientLoanAccountTemplate;
  draft: LoanAccountDraft;
  errors: LoanAccountStepErrors;
  onChange: (patch: Partial<LoanAccountDraft>) => void;
}) {
  const linkOptions = toSelectOptions(
    template.accountLinkingOptions?.map((account) => ({
      id: account.id,
      name: account.accountNo ?? String(account.id)
    }))
  );

  const linkedSavingsReasons = useMemo(
    () =>
      loanApplicationLinkedSavingsReasons(draft, {
        hasAccountTransferCharge: draftHasAccountTransferCharge(template, draft.charges)
      }),
    [draft, template]
  );

  const linkRequired = linkedSavingsReasons.length > 0 && !(draft.linkAccountId ?? 0);

  function linkedSavingsRequirementMessage(): string {
    if (linkedSavingsReasons.length === 1) {
      return `Link a savings account before submit — required for ${linkedSavingsReasons[0]}.`;
    }
    return `Link a savings account before submit — required for: ${linkedSavingsReasons.join('; ')}.`;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Link a savings account when you need repayments collected automatically, standing
        instructions, or account-transfer fees. You can set this any time before submit.
      </p>

      {errors.linkAccountId ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errors.linkAccountId}
        </p>
      ) : null}

      <DetailSection title="Automation">
        <SwitchField
          id="create-standing-instruction-at-disbursement"
          label="Create standing instruction at disbursement"
          description={LOAN_ACCOUNT_STANDING_INSTRUCTION_AT_DISBURSEMENT_HINT}
          checked={draft.createStandingInstructionAtDisbursement ?? false}
          onCheckedChange={(createStandingInstructionAtDisbursement) =>
            onChange({ createStandingInstructionAtDisbursement })
          }
          error={errors.createStandingInstructionAtDisbursement}
        />
      </DetailSection>

      {linkRequired && !errors.linkAccountId ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {linkedSavingsRequirementMessage()}
        </p>
      ) : null}

      <DetailSection title="Repayment account">
        <SelectField
          label="Link savings account"
          optional={linkedSavingsReasons.length === 0}
          required={linkedSavingsReasons.length > 0}
          value={draft.linkAccountId ? String(draft.linkAccountId) : undefined}
          onValueChange={(value) =>
            onChange({ linkAccountId: value ? Number(value) : undefined })
          }
          options={linkOptions}
          placeholder={linkedSavingsReasons.length > 0 ? 'Select a savings account' : 'Optional'}
          error={errors.linkAccountId}
          emptyMessage="No linked savings accounts available."
          hint={LOAN_ACCOUNT_LINK_SAVINGS_HINT}
          hintAriaLabel="About linked savings account"
        />
      </DetailSection>
    </div>
  );
}
