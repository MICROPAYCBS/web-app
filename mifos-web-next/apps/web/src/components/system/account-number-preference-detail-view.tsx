'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountNumberPreferenceDetail,
  FineractAccountNumberPreferenceTemplate
} from '@mifos/api-client';
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteAccountNumberPreferenceAction } from '@/actions/account-number-preferences';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { AccountNumberPreferenceFormSheet } from '@/components/system/account-number-preference-form-sheet';
import type { AccountNumberFormatOfficeOption } from '@/components/system/account-number-format-structured-fields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  accountNumberFormatModeLabel,
  accountNumberFormatPatternSummary,
  accountNumberPreferenceLabel
} from '@/lib/fineract/account-number-preference-display';

export function AccountNumberPreferenceDetailView({
  preference,
  template,
  canUpdate,
  canDelete,
  structuredFormatsEnabled,
  officeOptions = []
}: {
  preference: FineractAccountNumberPreferenceDetail;
  template: FineractAccountNumberPreferenceTemplate;
  canUpdate: boolean;
  canDelete: boolean;
  structuredFormatsEnabled: boolean;
  officeOptions?: AccountNumberFormatOfficeOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteAccountNumberPreferenceAction(preference.id);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      router.push('/system/account-number-preferences');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink
                href="/system/account-number-preferences"
                label="Back to preferences"
              />
            }
            title={accountNumberPreferenceLabel(preference.accountType)}
            meta="Account number generation preference."
            actions={
              <div className="flex flex-wrap gap-2">
                {canUpdate ? (
                  <Button type="button" size="sm" onClick={() => setEditOpen(true)} disabled={pending}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    disabled={pending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="Account type">
              {accountNumberPreferenceLabel(preference.accountType)}
            </DetailField>
            <DetailField label="Mode">
              <Badge variant={preference.structuredEnabled ? 'default' : 'secondary'}>
                {accountNumberFormatModeLabel(preference)}
              </Badge>
            </DetailField>
            {preference.structuredEnabled ? (
              <>
                <DetailField label="Format pattern">
                  <span className="font-mono text-sm">{preference.formatPattern ?? '—'}</span>
                </DetailField>
                <DetailField label="Format summary">
                  {accountNumberFormatPatternSummary(preference)}
                </DetailField>
                <DetailField label="Sequence scope">
                  {accountNumberPreferenceLabel(preference.sequenceScope)}
                </DetailField>
                <DetailField label="Check digit">
                  {accountNumberPreferenceLabel(preference.checkDigitAlgorithm)}
                </DetailField>
              </>
            ) : (
              <>
                <DetailField label="Prefix field">
                  {accountNumberPreferenceLabel(preference.prefixType)}
                </DetailField>
                <DetailField label="Prefix character">
                  {preference.prefixCharacter?.trim() ? preference.prefixCharacter : '—'}
                </DetailField>
              </>
            )}
          </DetailFieldGrid>
        }
      >
        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      {canUpdate ? (
        <AccountNumberPreferenceFormSheet
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
          template={template}
          preference={preference}
          structuredFormatsEnabled={structuredFormatsEnabled}
          officeOptions={officeOptions}
        />
      ) : null}

      {canDelete ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete preference</DialogTitle>
              <DialogDescription>
                Delete the account number preference for{' '}
                {accountNumberPreferenceLabel(preference.accountType)}? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
