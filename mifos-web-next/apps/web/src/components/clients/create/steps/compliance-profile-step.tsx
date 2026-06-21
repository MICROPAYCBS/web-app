'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ComplianceProfileInput, OtherBankAccountInput } from '@mifos/validation';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import type { CreateClientDraft } from '../types';
import type { StepErrors } from '../validation';

function emptyBankAccount(): OtherBankAccountInput {
  return { bankName: '', branchName: '', accountNumber: '' };
}

function bankAccountAt(
  accounts: OtherBankAccountInput[] | undefined,
  index: number
): OtherBankAccountInput {
  return accounts?.[index] ?? emptyBankAccount();
}

function patchBankAccount(
  profile: ComplianceProfileInput,
  index: number,
  patch: Partial<OtherBankAccountInput>
): ComplianceProfileInput {
  const accounts = [...(profile.otherBankAccounts ?? [])];
  while (accounts.length <= index) {
    accounts.push(emptyBankAccount());
  }
  accounts[index] = { ...accounts[index], ...patch };
  return { ...profile, otherBankAccounts: accounts };
}

export function ComplianceProfileStep({
  draft,
  errors,
  onComplianceChange
}: {
  draft: CreateClientDraft;
  errors: StepErrors;
  onComplianceChange: (profile: ComplianceProfileInput) => void;
}) {
  const profile = draft.complianceProfile;

  function patch(patch: Partial<ComplianceProfileInput>) {
    onComplianceChange({ ...profile, ...patch });
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Capture banking relationships, PEP declaration, FATCA, and Deposit Protection Fund routing
        details. All sections are optional unless indicated.
      </p>

      {errors._form ? <p className="text-sm text-destructive">{errors._form}</p> : null}

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Other banking relationships</h2>
        <SwitchField
          id="hasOtherBankAccounts"
          label="Has other bank accounts"
          optional
          checked={profile.hasOtherBankAccounts ?? false}
          description="Customer holds accounts with this bank or another institution."
          onCheckedChange={(checked) =>
            patch({
              hasOtherBankAccounts: checked,
              otherBankAccounts: checked ? profile.otherBankAccounts ?? [emptyBankAccount()] : []
            })
          }
        />
        {profile.hasOtherBankAccounts ? (
          <div className="grid gap-6">
            {[0, 1].map((index) => {
              const account = bankAccountAt(profile.otherBankAccounts, index);
              return (
                <div key={index} className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <p className="text-sm font-medium sm:col-span-2">Other bank {index + 1}</p>
                  <TextField
                    id={`otherBankName${index}`}
                    label="Bank name"
                    required={index === 0}
                    value={account.bankName}
                    onChange={(v) => patchBankAccount(profile, index, { bankName: v })}
                    error={index === 0 ? errors['otherBankAccounts.0.bankName'] : undefined}
                  />
                  <TextField
                    id={`otherBankBranch${index}`}
                    label="Branch"
                    optional
                    value={account.branchName ?? ''}
                    onChange={(v) => patchBankAccount(profile, index, { branchName: v })}
                  />
                  <TextField
                    id={`otherBankAccount${index}`}
                    label="Account number"
                    required={index === 0}
                    className="sm:col-span-2"
                    value={account.accountNumber}
                    onChange={(v) => patchBankAccount(profile, index, { accountNumber: v })}
                    error={index === 0 ? errors['otherBankAccounts.0.accountNumber'] : undefined}
                  />
                </div>
              );
            })}
            {errors.otherBankAccounts ? (
              <p className="text-sm text-destructive">{errors.otherBankAccounts}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Politically exposed person (PEP)</h2>
        <SwitchField
          id="isPep"
          label="Is PEP"
          optional
          checked={profile.isPep ?? false}
          onCheckedChange={(checked) => patch({ isPep: checked })}
        />
        {profile.isPep ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="pepPosition"
              label="PEP position held"
              required
              value={profile.pepPosition ?? ''}
              onChange={(v) => patch({ pepPosition: v })}
              error={errors.pepPosition}
            />
            <TextField
              id="pepRelativeName"
              label="PEP relative name"
              optional
              value={profile.pepRelativeName ?? ''}
              onChange={(v) => patch({ pepRelativeName: v })}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">FATCA</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="usCitizenOrResident"
            label="US citizen or resident"
            optional
            checked={profile.usCitizenOrResident ?? false}
            onCheckedChange={(checked) => patch({ usCitizenOrResident: checked })}
          />
          <SwitchField
            id="fatcaRegistered"
            label="FATCA registered"
            optional
            checked={profile.fatcaRegistered ?? false}
            onCheckedChange={(checked) => patch({ fatcaRegistered: checked })}
          />
        </div>
        {profile.fatcaRegistered ? (
          <TextField
            id="fatcaRegistrationNo"
            label="FATCA registration number"
            required
            value={profile.fatcaRegistrationNo ?? ''}
            onChange={(v) => patch({ fatcaRegistrationNo: v })}
            error={errors.fatcaRegistrationNo}
          />
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Deposit Protection Fund (DPF)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="dpfAlternativeBankName"
            label="Alternative bank name"
            optional
            value={profile.dpfAlternativeBankName ?? ''}
            onChange={(v) => patch({ dpfAlternativeBankName: v })}
          />
          <TextField
            id="dpfAlternativeAccountNumber"
            label="Alternative account number"
            optional
            value={profile.dpfAlternativeAccountNumber ?? ''}
            onChange={(v) => patch({ dpfAlternativeAccountNumber: v })}
          />
        </div>
      </section>
    </div>
  );
}

export function emptyComplianceProfile(): ComplianceProfileInput {
  return {
    hasOtherBankAccounts: false,
    isPep: false,
    usCitizenOrResident: false,
    fatcaRegistered: false,
    otherBankAccounts: []
  };
}
