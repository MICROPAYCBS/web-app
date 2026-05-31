'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate } from '@mifos/api-client';
import { LEGAL_FORM_PERSON } from '@mifos/validation';
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
  submitError
}: {
  template: FineractClientTemplate;
  draft: CreateClientDraft;
  submitError: string | null;
}) {
  const g = draft.general;
  const office = template.officeOptions.find((o) => o.id === g.officeId);
  const legalForm = template.clientLegalFormOptions?.find((o) => o.id === g.legalFormId);
  const isPerson = (g.legalFormId ?? LEGAL_FORM_PERSON) === LEGAL_FORM_PERSON;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the information below before creating the client.
      </p>
      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">General</h2>
        <Field label="Office" value={office?.nameDecorated ?? office?.name} />
        <Field label="Legal form" value={legalForm?.value ?? legalForm?.name} />
        {isPerson ? (
          <Field
            label="Name"
            value={[`${g.firstname ?? ''}`, g.middlename, g.lastname].filter(Boolean).join(' ')}
          />
        ) : (
          <Field label="Entity name" value={g.fullname} />
        )}
        <Field label="External ID" value={g.externalId} />
        <Field label="Mobile" value={g.mobileNo} />
        <Field label="Email" value={g.emailAddress} />
        <Field label="Submitted on" value={g.submittedOnDate} />
        <Field label="Active" value={g.active ? 'Yes' : 'No'} />
        {g.active ? <Field label="Activation date" value={g.activationDate} /> : null}
        {g.savingsProductId ? (
          <Field label="Savings product ID" value={String(g.savingsProductId)} />
        ) : null}
      </section>

      {draft.familyMembers.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Family members ({draft.familyMembers.length})</h2>
            <ul className="list-disc pl-5 text-sm">
              {draft.familyMembers.map((m, i) => (
                <li key={i}>
                  {m.firstName} {m.lastName}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {draft.addresses.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Addresses ({draft.addresses.length})</h2>
            <ul className="list-disc pl-5 text-sm">
              {draft.addresses.map((a, i) => (
                <li key={i}>
                  {[a.street, a.city].filter(Boolean).join(', ') || `Address ${i + 1}`}
                </li>
              ))}
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
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

    </div>
  );
}
