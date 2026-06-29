'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate, FineractIncomeSourceOptions } from '@mifos/api-client';
import { isComplianceProfileEmpty, LEGAL_FORM_PERSON } from '@mifos/validation';
import { formatDatatableTableTitle } from '@/lib/fineract/client-datatable-utils';
import { incomeSourceInputDisplayName } from '@/components/clients/detail/client-income-source-sections';
import { SectorDisplayValue } from '@/components/clients/shared/sector-display-value';
import type { CreateClientDraft } from '../types';
import { Separator } from '@/components/ui/separator';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function PreviewStep({
  template,
  draft,
  submitError,
  validationIssues = [],
  incomeSourceOptions,
  identifierDocumentTypes = []
}: {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  submitError: string | null;
  validationIssues?: string[];
  incomeSourceOptions?: FineractIncomeSourceOptions;
  identifierDocumentTypes?: { id: number; name: string }[];
}) {
  const g = draft.general;
  const legalForm = template.clientLegalFormOptions?.find((o) => o.id === g.legalFormId);
  const gender = template.genderOptions?.find((o) => o.id === g.genderId);
  const titleLabel =
    template.clientTitleOptions?.find((o) => o.id === g.titleId)?.titleName ??
    template.titleOptions?.find((o) => o.id === g.titleId)?.name;
  const nationality = template.nationalityOptions?.find((o) => o.id === g.nationalityCountryId);
  const maritalStatus = template.maritalStatusOptions?.find((o) => o.id === g.maritalStatusId);
  const riskProfile = template.customerRiskProfileOptions?.find(
    (o) => o.id === g.customerRiskProfileId
  );
  const customerClass = template.customerClassOptions?.find((c) => c.id === g.customerClassId);
  const staff = template.staffOptions?.find((o) => o.id === g.staffId);
  const isPerson = (g.legalFormId ?? LEGAL_FORM_PERSON) === LEGAL_FORM_PERSON;
  const customerClassLabel = customerClass
    ? `${customerClass.classCode} — ${customerClass.className}`
    : undefined;

  function incomeSourceTypeLabel(incomeSourceTypeId: number): string | undefined {
    return incomeSourceOptions?.incomeSourceTypeOptions?.find((o) => o.id === incomeSourceTypeId)?.name;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the information below before creating the customer.
      </p>
      {validationIssues.length > 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p className="font-medium">Still required before you can create this customer:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Biodata</h2>
        <Field label="Profile type" value={legalForm?.value ?? legalForm?.name} />
        <Field label="Customer class" value={customerClassLabel} />
        {isPerson ? (
          <Field label="Gender" value={gender?.name ?? gender?.value} />
        ) : null}
        {isPerson ? (
          <Field label="Title" value={titleLabel} />
        ) : null}
        {isPerson ? (
          <Field
            label="Name"
            value={[`${g.firstname ?? ''}`, g.middlename, g.lastname].filter(Boolean).join(' ')}
          />
        ) : (
          <Field label="Entity name" value={g.fullname} />
        )}
        {isPerson ? (
          <Field label="Nationality" value={nationality?.name ?? nationality?.value} />
        ) : null}
        {isPerson ? (
          <Field label="Marital status" value={maritalStatus?.name ?? maritalStatus?.value} />
        ) : null}
        <Field
          label={isPerson ? 'Date of birth' : 'Incorporation date'}
          value={g.dateOfBirth}
        />
        <Field label="External ID" value={g.externalId} />
      </section>

      <Separator />

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Contact</h2>
        <Field label="Phone number" value={g.mobileNo} />
        <Field label="Alternative phone number" value={g.alternativeMobileNo} />
        <Field label="Email" value={g.emailAddress} />
        <Field label="Alternative email" value={g.alternativeEmailAddress} />
      </section>

      <Separator />

      {draft.clientIdentifiers.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">
            Identification ({draft.clientIdentifiers.length})
          </h2>
          <ul className="list-disc pl-5 text-sm">
            {draft.clientIdentifiers.map((identifier, i) => {
              const typeName =
                identifierDocumentTypes.find((type) => type.id === identifier.documentTypeId)
                  ?.name ?? 'Identifier';
              return (
                <li key={i}>
                  {typeName}: {identifier.documentKey}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {draft.clientIdentifiers.length > 0 ? <Separator /> : null}

      {template.isAddressEnabled && draft.addresses.length === 0 ? (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-destructive">Address</h2>
            <p className="text-sm text-muted-foreground">
              No address added yet. Go back to the Address step and add at least one address.
            </p>
          </section>
          <Separator />
        </>
      ) : null}

      {draft.addresses.length > 0 ? (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Addresses ({draft.addresses.length})</h2>
            <ul className="list-disc pl-5 text-sm">
              {draft.addresses.map((a, i) => (
                <li key={i}>
                  {[a.street, a.city].filter(Boolean).join(', ') || `Address ${i + 1}`}
                  {a.isPrimary ? ' (Primary)' : ''}
                </li>
              ))}
            </ul>
          </section>
          <Separator />
        </>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Customer profiling</h2>
        <Field label="Tax identification number (TIN)" value={g.taxIdentificationNumber} />
        {g.subIndustryId != null ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Sub-industry</span>
            <SectorDisplayValue subIndustryId={g.subIndustryId} />
          </div>
        ) : null}
        <Field
          label="Customer risk profile"
          value={riskProfile?.name ?? riskProfile?.value}
        />
      </section>

      {draft.familyMembers.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Next of kin ({draft.familyMembers.length})</h2>
            <ul className="list-disc pl-5 text-sm">
              {draft.familyMembers.map((m, i) => (
                <li key={i}>
                  {[m.firstName, m.middleName, m.lastName].filter(Boolean).join(' ')}
                  {m.mobileNumber ? ` · ${m.mobileNumber}` : ''}
                  {m.emailAddress ? ` · ${m.emailAddress}` : ''}
                  {m.address ? ` · ${m.address}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {draft.incomeSources.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Income sources ({draft.incomeSources.length})</h2>
            <ul className="list-disc pl-5 text-sm">
              {draft.incomeSources.map((source, i) => (
                <li key={i}>
                  {incomeSourceInputDisplayName(
                    source,
                    incomeSourceTypeLabel(source.incomeSourceTypeId)
                  )}
                  {source.employerAddress ? ` · ${source.employerAddress}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {!isComplianceProfileEmpty(draft.complianceProfile) ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Compliance</h2>
            <ul className="list-disc pl-5 text-sm">
              {draft.complianceProfile.hasOtherBankAccounts ? (
                <li>
                  Other bank accounts:{' '}
                  {draft.complianceProfile.otherBankAccounts
                    ?.map((account) => account.bankName)
                    .filter(Boolean)
                    .join(', ') || 'Yes'}
                </li>
              ) : null}
              {draft.complianceProfile.isPep ? (
                <li>PEP: {draft.complianceProfile.pepPosition || 'Yes'}</li>
              ) : null}
              {draft.complianceProfile.usCitizenOrResident ? <li>US citizen or resident</li> : null}
              {draft.complianceProfile.fatcaRegistered ? (
                <li>FATCA registered: {draft.complianceProfile.fatcaRegistrationNo}</li>
              ) : null}
              {draft.complianceProfile.dpfAlternativeBankName ? (
                <li>DPF bank: {draft.complianceProfile.dpfAlternativeBankName}</li>
              ) : null}
            </ul>
          </section>
        </>
      ) : null}

      {Object.keys(draft.datatables).length > 0 ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Custom data tables</h2>
            <ul className="list-disc pl-5 text-sm">
              {Object.keys(draft.datatables).map((name) => (
                <li key={name}>{formatDatatableTableTitle(name)}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {Object.keys(draft.multiRowDatatables).some(
        (name) => (draft.multiRowDatatables[name]?.length ?? 0) > 0
      ) ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Multi-row data tables</h2>
            <ul className="list-disc pl-5 text-sm">
              {Object.entries(draft.multiRowDatatables)
                .filter(([, rows]) => rows.length > 0)
                .map(([name, rows]) => (
                  <li key={name}>
                    {formatDatatableTableTitle(name)} ({rows.length}{' '}
                    {rows.length === 1 ? 'row' : 'rows'})
                  </li>
                ))}
            </ul>
          </section>
        </>
      ) : null}

      <Separator />

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Account opening</h2>
        <Field
          label="Relationship officer"
          value={
            staff?.displayName ??
            (staff ? `${staff.firstname ?? ''} ${staff.lastname ?? ''}`.trim() : undefined)
          }
        />
        {isPerson && g.isStaff ? <Field label="Is staff" value="Yes" /> : null}
        <Field label="Submitted on" value={g.submittedOnDate} />
        <Field label="Status" value="Pending" />
        {g.savingsProductId ? (
          <Field
            label="Savings product on activation"
            value={
              template.savingProductOptions?.find((p) => p.id === g.savingsProductId)?.name ??
              String(g.savingsProductId)
            }
          />
        ) : null}
      </section>

    </div>
  );
}
