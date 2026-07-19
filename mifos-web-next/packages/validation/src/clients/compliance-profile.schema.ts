/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const otherBankAccountSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  bankName: z.string().trim().max(200),
  branchName: z.string().trim().max(200).optional().or(z.literal('')),
  accountNumber: z.string().trim().max(50),
  displayOrder: z.coerce.number().int().min(1).max(2).optional()
});

function otherBankSlotHasAnyInput(account: z.infer<typeof otherBankAccountSchema>): boolean {
  return Boolean(
    account.bankName.trim() || account.accountNumber.trim() || account.branchName?.trim()
  );
}

export const complianceProfileSchema = z
  .object({
    hasOtherBankAccounts: z.boolean().optional(),
    isPep: z.boolean().optional(),
    pepPosition: z.string().trim().max(200).optional().or(z.literal('')),
    pepRelativeName: z.string().trim().max(200).optional().or(z.literal('')),
    usCitizenOrResident: z.boolean().optional(),
    fatcaRegistered: z.boolean().optional(),
    fatcaRegistrationNo: z.string().trim().max(100).optional().or(z.literal('')),
    dpfAlternativeBankName: z.string().trim().max(200).optional().or(z.literal('')),
    dpfAlternativeAccountNumber: z.string().trim().max(50).optional().or(z.literal('')),
    otherBankAccounts: z.array(otherBankAccountSchema).max(2).optional(),
    locale: z.string().optional()
  })
  .superRefine((data, ctx) => {
    const accounts = data.otherBankAccounts ?? [];

    for (const [index, account] of accounts.entries()) {
      if (!otherBankSlotHasAnyInput(account)) {
        continue;
      }
      if (!account.bankName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bank name is required for each other bank account you enter',
          path: ['otherBankAccounts', index, 'bankName']
        });
      }
      if (!account.accountNumber.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account number is required for each other bank account you enter',
          path: ['otherBankAccounts', index, 'accountNumber']
        });
      }
    }

    if (data.hasOtherBankAccounts) {
      const completeAccounts = accounts.filter(
        (account) => account.bankName.trim() && account.accountNumber.trim()
      );
      if (completeAccounts.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Add at least one other bank account when this option is selected',
          path: ['otherBankAccounts']
        });
      }
    }
    if (data.isPep && !data.pepPosition?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PEP position is required when the customer is a PEP',
        path: ['pepPosition']
      });
    }
    if (data.fatcaRegistered && !data.fatcaRegistrationNo?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FATCA registration number is required when registered',
        path: ['fatcaRegistrationNo']
      });
    }
  });

export type OtherBankAccountInput = z.input<typeof otherBankAccountSchema>;
export type ComplianceProfileInput = z.input<typeof complianceProfileSchema>;

export function isComplianceProfileEmpty(profile: ComplianceProfileInput | undefined): boolean {
  if (!profile) {
    return true;
  }
  const hasFlags =
    profile.hasOtherBankAccounts ||
    profile.isPep ||
    profile.usCitizenOrResident ||
    profile.fatcaRegistered;
  const hasText = [
    profile.pepPosition,
    profile.pepRelativeName,
    profile.fatcaRegistrationNo,
    profile.dpfAlternativeBankName,
    profile.dpfAlternativeAccountNumber
  ].some((v) => Boolean(v?.trim()));
  const hasAccounts = (profile.otherBankAccounts ?? []).some((account) => otherBankSlotHasAnyInput(account));
  return !hasFlags && !hasText && !hasAccounts;
}

/** Drop blank bank rows and omit the profile when nothing meaningful remains. */
export function sanitizeComplianceProfileForSubmit(
  profile: ComplianceProfileInput | undefined
): ComplianceProfileInput | undefined {
  if (!profile) {
    return undefined;
  }

  const otherBankAccounts = (profile.otherBankAccounts ?? []).filter(
    (account) => account.bankName?.trim() && account.accountNumber?.trim()
  );

  const normalized: ComplianceProfileInput = {
    ...profile,
    otherBankAccounts
  };

  return isComplianceProfileEmpty(normalized) ? undefined : normalized;
}

/** Drop completely empty bank rows before Zod validates the array (UI keeps two slots). */
export function prepareComplianceProfileForValidation(
  profile: ComplianceProfileInput
): ComplianceProfileInput {
  return {
    ...profile,
    otherBankAccounts: (profile.otherBankAccounts ?? []).filter((account) => otherBankSlotHasAnyInput(account))
  };
}
