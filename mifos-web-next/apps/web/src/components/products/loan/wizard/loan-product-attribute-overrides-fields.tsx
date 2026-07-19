'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductAttributeOverrides, LoanProductKind } from '@mifos/api-client';
import { DetailSection } from '@/components/composites';
import { SwitchField } from '@/components/composites/switch-field';
import {
  defaultLoanProductAttributeOverrides,
  loanProductAttributeOverrideFields
} from '@/lib/fineract/loan-product-attribute-overrides';

export function LoanProductAttributeOverridesFields({
  productKind,
  enabled,
  overrides,
  errors,
  onEnabledChange,
  onOverridesChange
}: {
  productKind: LoanProductKind;
  enabled: boolean;
  overrides: LoanProductAttributeOverrides;
  errors: Record<string, string | undefined>;
  onEnabledChange: (enabled: boolean) => void;
  onOverridesChange: (overrides: LoanProductAttributeOverrides) => void;
}) {
  const fields = loanProductAttributeOverrideFields(productKind);

  function setOverride(key: keyof LoanProductAttributeOverrides, value: boolean) {
    onOverridesChange({ ...overrides, [key]: value });
  }

  return (
    <DetailSection title="Configurable terms and settings">
      <div className="space-y-4">
        <SwitchField
          id="settings.allowAttributeConfiguration"
          label="Allow overriding selected terms and settings in loan accounts"
          checked={enabled}
          onCheckedChange={(next) => {
            onEnabledChange(next);
            if (next) {
              onOverridesChange(defaultLoanProductAttributeOverrides(productKind, true));
            } else {
              onOverridesChange(defaultLoanProductAttributeOverrides(productKind, false));
            }
          }}
          error={errors['settings.allowAttributeConfiguration']}
        />

        {enabled ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <SwitchField
                key={field.key}
                id={`settings.allowAttributeOverrides.${field.key}`}
                label={field.label}
                checked={overrides[field.key] ?? false}
                onCheckedChange={(value) => setOverride(field.key, value)}
                error={errors[`settings.allowAttributeOverrides.${field.key}`]}
              />
            ))}
          </div>
        ) : null}
      </div>
    </DetailSection>
  );
}
