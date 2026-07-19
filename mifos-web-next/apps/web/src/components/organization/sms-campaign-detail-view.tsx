'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SmsCampaignDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { LockOpen, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  activateSmsCampaignAction,
  closeSmsCampaignAction,
  deleteSmsCampaignAction,
  reactivateSmsCampaignAction
} from '@/actions/sms-campaign';
import { SmsCampaignMessagesPanel } from '@/components/organization/sms-campaign-messages-panel';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { DateField } from '@/components/composites/date-field';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE, toFineractDate } from '@/lib/fineract/dates';
import {
  formatSmsCampaignStatus,
  formatSmsCampaignSubmittedOn
} from '@/lib/fineract/sms-campaign-display';
import {
  smsCampaignEditPath,
  SMS_CAMPAIGN_LIST_PATH
} from '@/lib/fineract/sms-campaign-paths';
import { cn } from '@/lib/utils';

type CommandKind = 'activate' | 'close' | 'reactivate';

export function SmsCampaignDetailView({
  campaign,
  canEdit,
  canActivate,
  canClose,
  canReactivate,
  canDelete
}: {
  campaign: SmsCampaignDetail;
  canEdit: boolean;
  canActivate: boolean;
  canClose: boolean;
  canReactivate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [commandKind, setCommandKind] = useState<CommandKind | null>(null);
  const [commandDate, setCommandDate] = useState(toFineractDate(new Date()));
  const [commandError, setCommandError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = campaign.campaignStatus?.value ?? '';
  const isActive = status.toLowerCase() === 'active';
  const isPending = status.toLowerCase() === 'pending';
  const isClosed = status.toLowerCase() === 'closed';

  function openCommand(kind: CommandKind) {
    setCommandKind(kind);
    setCommandDate(toFineractDate(new Date()));
    setCommandError(null);
  }

  function runCommand() {
    if (!commandKind) {
      return;
    }
    setCommandError(null);
    startTransition(async () => {
      const localeFields = {
        locale: FINERACT_LOCALE,
        dateFormat: FINERACT_DATE_FORMAT
      };

      const result =
        commandKind === 'activate'
          ? await activateSmsCampaignAction(campaign.id, {
              activationDate: commandDate,
              ...localeFields
            })
          : commandKind === 'close'
            ? await closeSmsCampaignAction(campaign.id, {
                closureDate: commandDate,
                ...localeFields
              })
            : await reactivateSmsCampaignAction(campaign.id, {
                activationDate: commandDate,
                ...localeFields
              });

      if (!result.ok) {
        setCommandError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      setCommandKind(null);
      router.refresh();
    });
  }

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteSmsCampaignAction(campaign.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteOpen(false);
      router.push(SMS_CAMPAIGN_LIST_PATH);
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={SMS_CAMPAIGN_LIST_PATH} label="Back to SMS campaigns" />
            }
            title={campaign.campaignName}
            actions={
              <div className="flex flex-wrap gap-2">
                {!isActive && canEdit ? (
                  <Link
                    href={smsCampaignEditPath(campaign.id)}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    <Pencil className="mr-1 size-4" />
                    Edit
                  </Link>
                ) : null}
                {isPending && canActivate ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openCommand('activate')}
                  >
                    <LockOpen className="mr-1 size-4" />
                    Activate
                  </Button>
                ) : null}
                {!isClosed && canClose ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => openCommand('close')}
                  >
                    <X className="mr-1 size-4" />
                    Close
                  </Button>
                ) : null}
                {!isPending && !isActive && canReactivate ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => openCommand('reactivate')}
                  >
                    <RotateCcw className="mr-1 size-4" />
                    Reactivate
                  </Button>
                ) : null}
                {isClosed && canDelete ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>
            }
          />
        }
      >
        <Tabs defaultValue="campaign" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="campaign" className="space-y-6">
            <DetailSection title="Overview">
              <DetailFieldGrid>
                <DetailField label="Report name">{campaign.reportName ?? '—'}</DetailField>
                <DetailField label="Status">
                  {formatSmsCampaignStatus(campaign.campaignStatus?.value)}
                </DetailField>
                <DetailField label="Trigger type">{campaign.triggerType?.value ?? '—'}</DetailField>
                <DetailField label="Submitted on">
                  {formatSmsCampaignSubmittedOn(campaign)}
                </DetailField>
                {campaign.recurrence ? (
                  <DetailField label="Recurrence">{campaign.recurrence}</DetailField>
                ) : null}
              </DetailFieldGrid>
            </DetailSection>

            <DetailSection title="Template message">
              <Textarea value={campaign.campaignMessage} readOnly rows={6} className="bg-muted/30" />
            </DetailSection>
          </TabsContent>

          <TabsContent value="messages">
            <SmsCampaignMessagesPanel campaignId={campaign.id} />
          </TabsContent>
        </Tabs>
      </DetailPage>

      <Dialog open={commandKind != null} onOpenChange={(open) => !open && setCommandKind(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {commandKind === 'activate'
                ? 'Activate SMS campaign'
                : commandKind === 'close'
                  ? 'Close SMS campaign'
                  : 'Reactivate SMS campaign'}
            </DialogTitle>
            <DialogDescription>
              Choose the effective date for this action.
            </DialogDescription>
          </DialogHeader>
          <DateField
            id="sms-command-date"
            label={
              commandKind === 'close'
                ? 'Closure date'
                : commandKind === 'reactivate'
                  ? 'Reactivation date'
                  : 'Activation date'
            }
            value={commandDate}
            onChange={(value) => setCommandDate(value ?? '')}
          />
          {commandError ? <p className="text-sm text-destructive">{commandError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCommandKind(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={runCommand} disabled={pending || !commandDate}>
              {pending ? 'Confirming…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SMS campaign</DialogTitle>
            <DialogDescription>
              This permanently deletes the closed campaign. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
