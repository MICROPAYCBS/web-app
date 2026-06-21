/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientComplianceProfile, FineractClientOtherBankAccount } from '@mifos/api-client';
import { DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';

function formatOtherBankSummary(account: FineractClientOtherBankAccount): string {
  return [account.bankName, account.branchName, account.accountNumber].filter(Boolean).join(' · ');
}

export function ClientComplianceProfileSections({
  profile
}: {
  profile: FineractClientComplianceProfile | null;
}) {
  if (!profile) {
    return null;
  }

  const accounts = profile.otherBankAccounts ?? [];
  const hasAny =
    profile.hasOtherBankAccounts ||
    profile.isPep ||
    profile.usCitizenOrResident ||
    profile.fatcaRegistered ||
    profile.dpfAlternativeBankName ||
    profile.dpfAlternativeAccountNumber ||
    accounts.length > 0;

  if (!hasAny) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DetailSection title="Other banking">
        <DetailFieldGrid>
          <DetailField label="Has other bank accounts">
            <TextValue value={formatYesNo(profile.hasOtherBankAccounts)} />
          </DetailField>
          {accounts.map((account, index) => (
            <DetailField key={account.id ?? index} label={`Other bank ${index + 1}`}>
              <TextValue value={formatOtherBankSummary(account)} />
            </DetailField>
          ))}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="PEP declaration">
        <DetailFieldGrid>
          <DetailField label="Is PEP">
            <TextValue value={formatYesNo(profile.isPep)} />
          </DetailField>
          <DetailField label="PEP position">
            <TextValue value={profile.pepPosition} />
          </DetailField>
          <DetailField label="PEP relative name">
            <TextValue value={profile.pepRelativeName} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="FATCA">
        <DetailFieldGrid>
          <DetailField label="US citizen or resident">
            <TextValue value={formatYesNo(profile.usCitizenOrResident)} />
          </DetailField>
          <DetailField label="FATCA registered">
            <TextValue value={formatYesNo(profile.fatcaRegistered)} />
          </DetailField>
          <DetailField label="FATCA registration number">
            <TextValue value={profile.fatcaRegistrationNo} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Deposit Protection Fund (DPF)">
        <DetailFieldGrid>
          <DetailField label="Alternative bank name">
            <TextValue value={profile.dpfAlternativeBankName} />
          </DetailField>
          <DetailField label="Alternative account number">
            <TextValue value={profile.dpfAlternativeAccountNumber} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>
    </div>
  );
}
