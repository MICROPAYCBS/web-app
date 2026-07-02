'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientComplianceProfile } from '@mifos/api-client';
import {
  complianceProfileSchema,
  prepareComplianceProfileForValidation,
  type ComplianceProfileInput
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateClientComplianceProfileAction } from '@/actions/client-compliance-profile';
import { ComplianceProfileStep, emptyComplianceProfile } from '@/components/clients/create/steps/compliance-profile-step';
import { ClientComplianceProfileSections } from '@/components/clients/detail/client-compliance-profile-sections';
import { Button } from '@/components/ui/button';
import type { CreateClientDraft } from '@/components/clients/create/types';
import type { StepErrors } from '@/components/clients/create/validation';
import { toastActionError } from '@/lib/toast-fineract-error';
import { normalizeOtherBankAccounts } from '@/lib/fineract/compliance-profile-normalize';

function mapProfileToInput(profile: FineractClientComplianceProfile | null): ComplianceProfileInput {
  if (!profile) {
    return emptyComplianceProfile();
  }
  return {
    hasOtherBankAccounts: profile.hasOtherBankAccounts ?? false,
    isPep: profile.isPep ?? false,
    pepPosition: profile.pepPosition ?? '',
    pepRelativeName: profile.pepRelativeName ?? '',
    usCitizenOrResident: profile.usCitizenOrResident ?? false,
    fatcaRegistered: profile.fatcaRegistered ?? false,
    fatcaRegistrationNo: profile.fatcaRegistrationNo ?? '',
    dpfAlternativeBankName: profile.dpfAlternativeBankName ?? '',
    dpfAlternativeAccountNumber: profile.dpfAlternativeAccountNumber ?? '',
    otherBankAccounts: normalizeOtherBankAccounts(profile.otherBankAccounts).map((account) => ({
      id: account.id,
      bankName: account.bankName,
      branchName: account.branchName ?? '',
      accountNumber: account.accountNumber,
      displayOrder: account.displayOrder
    }))
  };
}

export function ClientComplianceProfileView({
  clientId,
  initialProfile,
  canUpdate
}: {
  clientId: string;
  initialProfile: FineractClientComplianceProfile | null;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<StepErrors>({});
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<CreateClientDraft>(() => ({
    general: {},
    clientIdentifiers: [],
    familyMembers: [],
    incomeSources: [],
    complianceProfile: mapProfileToInput(initialProfile),
    addresses: [],
    datatables: {},
    multiRowDatatables: {}
  }));

  function handleSave() {
    setValidationError(null);
    setFieldErrors({});
    const prepared = prepareComplianceProfileForValidation(draft.complianceProfile);
    const parsed = complianceProfileSchema.safeParse(prepared);
    if (!parsed.success) {
      const nextErrors: StepErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_form';
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setValidationError('Please fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result = await updateClientComplianceProfileAction(clientId, parsed.data);
      if (!result.ok) {
        const { _form: _ignored, ...inputFieldErrors } = result.fieldErrors ?? {};
        setFieldErrors(inputFieldErrors);
        if (result.message === 'Please fix the highlighted fields.') {
          setValidationError(result.message);
        } else {
          toastActionError(result.message, inputFieldErrors);
        }
        return;
      }
      toast.success('Compliance profile saved.');
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <ComplianceProfileStep
          draft={draft}
          errors={{ ...fieldErrors, ...(validationError ? { _form: validationError } : {}) }}
          onComplianceChange={(complianceProfile) =>
            setDraft((current) => ({ ...current, complianceProfile }))
          }
        />
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setEditing(false);
              setValidationError(null);
              setFieldErrors({});
              setDraft((current) => ({
                ...current,
                complianceProfile: mapProfileToInput(initialProfile)
              }));
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const hasProfile = initialProfile && (
    initialProfile.hasOtherBankAccounts ||
    initialProfile.isPep ||
    initialProfile.usCitizenOrResident ||
    initialProfile.fatcaRegistered ||
    initialProfile.dpfAlternativeBankName ||
    initialProfile.dpfAlternativeAccountNumber ||
    (initialProfile.otherBankAccounts?.length ?? 0) > 0
  );

  return (
    <div className="space-y-4">
      {canUpdate ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          {hasProfile ? 'Edit compliance profile' : 'Add compliance profile'}
        </Button>
      ) : null}
      {hasProfile ? (
        <ClientComplianceProfileSections profile={initialProfile} />
      ) : (
        <p className="text-sm text-muted-foreground">No compliance details recorded yet.</p>
      )}
    </div>
  );
}
