'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  Briefcase,
  Landmark,
  PieChart,
  PiggyBank,
  User,
  type LucideIcon
} from 'lucide-react';
import { DetailField } from '@/components/composites';
import { CHARGE_APPLIES_TO } from '@/lib/fineract/charge-form-logic';
import { fineractOptionLabel } from '@/lib/form/select-options';
import { cn } from '@/lib/utils';
import type { ChargeStepProps, ChargeWizardDraft } from '../types';

const APPLIES_TO_META: Record<number, { description: string; icon: LucideIcon }> = {
  [CHARGE_APPLIES_TO.LOAN]: {
    description: 'Fees and penalties on loan products and accounts.',
    icon: Landmark
  },
  [CHARGE_APPLIES_TO.SAVINGS]: {
    description: 'Fees on savings and deposit products.',
    icon: PiggyBank
  },
  [CHARGE_APPLIES_TO.CLIENT]: {
    description: 'Fees charged directly to a client.',
    icon: User
  },
  [CHARGE_APPLIES_TO.SHARES]: {
    description: 'Fees on share products and accounts.',
    icon: PieChart
  },
  [CHARGE_APPLIES_TO.WORKING_CAPITAL]: {
    description: 'Fees on working capital products.',
    icon: Briefcase
  }
};

function appliesToResetPatch(chargeAppliesTo: number): Partial<ChargeWizardDraft> {
  return {
    chargeAppliesTo,
    chargeTimeType: undefined,
    chargeCalculationType: undefined,
    chargePaymentMode: undefined,
    incomeAccountId: undefined,
    feeInterval: undefined,
    feeFrequency: undefined,
    feeOnMonthDay: undefined,
    addFeeFrequency: false
  };
}

export function AppliesToStep({
  mode,
  template,
  draft,
  errors,
  onChange
}: ChargeStepProps & {
  onChange: (patch: Partial<ChargeWizardDraft>) => void;
}) {
  const appliesToLabel = template.chargeAppliesTo
    ? fineractOptionLabel(template.chargeAppliesTo)
    : undefined;
  const options = template.chargeAppliesToOptions ?? [];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose where this charge applies. The options below determine which fields appear in the
        next steps.
      </p>

      {mode === 'edit' ? (
        <DetailField label="Applies to">{appliesToLabel ?? '—'}</DetailField>
      ) : (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Applies to</legend>
          <div
            className="grid gap-3 sm:grid-cols-2"
            role="radiogroup"
            aria-required="true"
            aria-invalid={Boolean(errors.chargeAppliesTo)}
          >
            {options.map((option) => {
              const id = option.id;
              const selected = draft.chargeAppliesTo === id;
              const meta = id != null ? APPLIES_TO_META[id] : undefined;
              const Icon = meta?.icon;
              const label = fineractOptionLabel(option);
              const controlId = `charge-applies-to-${id}`;

              return (
                <label
                  key={id}
                  htmlFor={controlId}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-input hover:bg-muted/40'
                  )}
                >
                  <input
                    id={controlId}
                    type="radio"
                    name="chargeAppliesTo"
                    className="sr-only"
                    checked={selected}
                    onChange={() => {
                      if (id != null) {
                        onChange(appliesToResetPatch(id));
                      }
                    }}
                  />
                  {Icon ? (
                    <Icon
                      className={cn(
                        'mt-0.5 size-5 shrink-0',
                        selected ? 'text-primary' : 'text-muted-foreground'
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{label}</span>
                    {meta?.description ? (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {meta.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.chargeAppliesTo ? (
            <p className="text-sm text-destructive">{errors.chargeAppliesTo}</p>
          ) : null}
        </fieldset>
      )}
    </div>
  );
}
