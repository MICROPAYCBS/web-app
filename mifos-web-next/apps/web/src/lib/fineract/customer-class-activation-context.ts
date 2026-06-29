/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { CustomerClass, FineractClientComplianceProfile, FineractClientDetail } from '@mifos/api-client';
import { LEGAL_FORM_PERSON, type ComplianceProfileInput } from '@mifos/validation';
import { getClientComplianceProfile } from '@/lib/fineract/client-compliance-profile';
import { clientHasProfileImage } from '@/lib/fineract/client-image';
import { getClientIdentifiers } from '@/lib/fineract/client-identifiers';
import { getClientSignatureInfo } from '@/lib/fineract/client-signature';
import { getCustomerClass } from '@/lib/fineract/customer-classes';
import {
  getCustomerClassActivationIssues,
  type CustomerClassActivationClientState,
  type CustomerClassActivationIssue
} from '@/lib/fineract/customer-class-eligibility';
import { getClient } from '@/lib/fineract/clients';
import {
  fineractApiDateToFormString,
  resolveFineractDateContext
} from '@/lib/fineract/fineract-date-context';

function customerClassHasActivationRules(customerClass?: CustomerClass | null): boolean {
  if (!customerClass) {
    return false;
  }
  return (
    customerClass.enforceCustPhoto != null ||
    customerClass.enforceCustSignature != null ||
    customerClass.enforceCustDocument != null ||
    customerClass.legalFormId != null ||
    customerClass.minAge != null ||
    customerClass.maxAge != null ||
    Boolean(customerClass.riskLevel?.trim()) ||
    customerClass.enhancedDueDiligence === true
  );
}

async function resolveCustomerClassForActivation(
  client: FineractClientDetail
): Promise<CustomerClass | undefined> {
  const embedded = client.customerClass;
  if (customerClassHasActivationRules(embedded)) {
    return embedded;
  }

  const customerClassId = client.customerClassId ?? embedded?.id;
  if (customerClassId == null) {
    return embedded;
  }

  const loaded = await getCustomerClass(customerClassId);
  return loaded ?? embedded;
}

function mapComplianceProfileToInput(
  profile: FineractClientComplianceProfile | null
): ComplianceProfileInput | null {
  if (!profile) {
    return null;
  }

  return {
    hasOtherBankAccounts: profile.hasOtherBankAccounts,
    isPep: profile.isPep,
    pepPosition: profile.pepPosition,
    pepRelativeName: profile.pepRelativeName,
    usCitizenOrResident: profile.usCitizenOrResident,
    fatcaRegistered: profile.fatcaRegistered,
    fatcaRegistrationNo: profile.fatcaRegistrationNo,
    dpfAlternativeBankName: profile.dpfAlternativeBankName,
    dpfAlternativeAccountNumber: profile.dpfAlternativeAccountNumber,
    otherBankAccounts: profile.otherBankAccounts?.map((account) => ({
      bankName: account.bankName,
      branchName: account.branchName,
      accountNumber: account.accountNumber
    }))
  };
}

export function buildCustomerClassActivationClientState(
  client: FineractClientDetail,
  extras: {
    hasProfileImage: boolean;
    hasSignature: boolean;
    identifierCount: number;
    complianceProfile: FineractClientComplianceProfile | null;
  }
): CustomerClassActivationClientState {
  const dateCtx = resolveFineractDateContext();

  return {
    legalFormId: client.legalForm?.id ?? LEGAL_FORM_PERSON,
    dateOfBirth: fineractApiDateToFormString(client.dateOfBirth, dateCtx),
    customerRiskProfile: client.customerRiskProfile,
    hasProfileImage: extras.hasProfileImage,
    hasSignature: extras.hasSignature,
    identifierCount: extras.identifierCount,
    complianceProfile: mapComplianceProfileToInput(extras.complianceProfile)
  };
}

export async function getCustomerClassActivationIssuesForClient(
  clientId: string | number
): Promise<CustomerClassActivationIssue[]> {
  const client = await getClient(clientId);
  const [customerClass, identifiers, signatureInfo, complianceProfile] = await Promise.all([
    resolveCustomerClassForActivation(client),
    getClientIdentifiers(clientId).catch(() => []),
    getClientSignatureInfo(clientId).catch(() => ({ hasSignature: false })),
    getClientComplianceProfile(clientId).catch(() => null)
  ]);

  const clientState = buildCustomerClassActivationClientState(client, {
    hasProfileImage: clientHasProfileImage(client),
    hasSignature: signatureInfo.hasSignature,
    identifierCount: identifiers.length,
    complianceProfile
  });

  return getCustomerClassActivationIssues(customerClass, clientState);
}
