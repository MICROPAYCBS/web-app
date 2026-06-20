'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanAccountPayoutStepInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { LoanAccountStepErrors } from '../validation';

export function LoanAccountPayoutStep({
  template,
  draft,
  errors,
  onChange
}: {
  template: ClientLoanAccountTemplate;
  draft: LoanAccountPayoutStepInput;
  errors: LoanAccountStepErrors;
  onChange: (patch: Partial<LoanAccountPayoutStepInput>) => void;
}) {
  const linkOptions = toSelectOptions(
    template.accountLinkingOptions?.map((account) => ({
      id: account.id,
      name: account.accountNo ?? String(account.id)
    }))
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Link a savings account for repayments and choose how disbursement should be handled.
      </p>
      <DetailSection title="Repayment account">
        <SelectField
          label="Link savings account"
          optional
          value={draft.linkAccountId ? String(draft.linkAccountId) : undefined}
          onValueChange={(value) =>
            onChange({ linkAccountId: value ? Number(value) : undefined })
          }
          options={linkOptions}
          placeholder="Optional"
          error={errors.linkAccountId}
          emptyMessage="No linked savings accounts available."
        />
      </DetailSection>
      <DetailSection title="Disbursement">
        <SwitchField
          id="disburse-to-savings"
          label="Disburse to savings"
          description="Move funds directly to the customer's linked savings account upon disbursal."
          checked={draft.disburseToSavings ?? false}
          onCheckedChange={(disburseToSavings) => onChange({ disburseToSavings })}
          error={errors.disburseToSavings}
        />
      </DetailSection>
    </div>
  );
}
