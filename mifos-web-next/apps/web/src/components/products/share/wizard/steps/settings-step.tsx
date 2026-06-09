'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductSettingsInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { ShareProductStepProps } from '../types';

export function SettingsStep({
  template,
  draft,
  errors,
  onChange
}: ShareProductStepProps & {
  onChange: (patch: Partial<ShareProductSettingsInput>) => void;
}) {
  const settings = draft.settings;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Share limits, dividend eligibility, and optional lock-in period.
      </p>

      <DetailSection title="Share limits">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            id="settings.minimumShares"
            label="Minimum shares"
            optional
            integer
            value={String(settings.minimumShares ?? '')}
            onChange={(value) =>
              onChange({ minimumShares: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.minimumShares']}
          />
          <NumericField
            id="settings.nominalShares"
            label="Nominal shares"
            required
            integer
            value={String(settings.nominalShares ?? '')}
            onChange={(value) =>
              onChange({ nominalShares: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.nominalShares']}
          />
          <NumericField
            id="settings.maximumShares"
            label="Maximum shares"
            optional
            integer
            value={String(settings.maximumShares ?? '')}
            onChange={(value) =>
              onChange({ maximumShares: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.maximumShares']}
          />
        </div>
      </DetailSection>

      <DetailSection title="Dividends">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            id="settings.minimumActivePeriodForDividends"
            label="Minimum active period for dividends"
            required
            integer
            value={String(settings.minimumActivePeriodForDividends ?? '')}
            onChange={(value) =>
              onChange({
                minimumActivePeriodForDividends: value === '' ? undefined : Number(value)
              })
            }
            error={errors['settings.minimumActivePeriodForDividends']}
          />
          <SelectField
            id="settings.minimumactiveperiodFrequencyType"
            label="Minimum active period type"
            optional
            value={
              settings.minimumactiveperiodFrequencyType != null
                ? String(settings.minimumactiveperiodFrequencyType)
                : undefined
            }
            onValueChange={(value) =>
              onChange({
                minimumactiveperiodFrequencyType: value ? Number(value) : undefined
              })
            }
            options={toSelectOptions(template.minimumActivePeriodFrequencyTypeOptions)}
            error={errors['settings.minimumactiveperiodFrequencyType']}
          />
          <SwitchField
            id="settings.allowDividendCalculationForInactiveClients"
            label="Allow dividend calculation for inactive clients"
            checked={settings.allowDividendCalculationForInactiveClients ?? false}
            onCheckedChange={(allowDividendCalculationForInactiveClients) =>
              onChange({ allowDividendCalculationForInactiveClients })
            }
            error={errors['settings.allowDividendCalculationForInactiveClients']}
          />
        </div>
      </DetailSection>

      <DetailSection title="Lock-in">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.enableLockinPeriod"
            label="Enable lock-in period"
            checked={settings.enableLockinPeriod ?? false}
            onCheckedChange={(enableLockinPeriod) => {
              if (!enableLockinPeriod) {
                onChange({
                  enableLockinPeriod: false,
                  lockinPeriodFrequency: undefined,
                  lockinPeriodFrequencyType: undefined
                });
              } else {
                onChange({ enableLockinPeriod: true });
              }
            }}
            error={errors['settings.enableLockinPeriod']}
          />
          {settings.enableLockinPeriod ? (
            <>
              <NumericField
                id="settings.lockinPeriodFrequency"
                label="Lock-in frequency"
                required
                integer
                value={String(settings.lockinPeriodFrequency ?? '')}
                onChange={(value) =>
                  onChange({
                    lockinPeriodFrequency: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.lockinPeriodFrequency']}
              />
              <SelectField
                id="settings.lockinPeriodFrequencyType"
                label="Lock-in frequency type"
                required
                value={
                  settings.lockinPeriodFrequencyType != null
                    ? String(settings.lockinPeriodFrequencyType)
                    : undefined
                }
                onValueChange={(value) =>
                  onChange({
                    lockinPeriodFrequencyType: value ? Number(value) : undefined
                  })
                }
                options={toSelectOptions(template.lockinPeriodFrequencyTypeOptions)}
                error={errors['settings.lockinPeriodFrequencyType']}
              />
            </>
          ) : null}
        </div>
      </DetailSection>
    </div>
  );
}
