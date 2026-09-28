'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsAccountPaymentChannel } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { executeSavingsAccountPaymentChannelAction } from '@/actions/savings-account-command';
import { DetailSection } from '@/components/composites';
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
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { channelChargeTimingLabelFor } from '@/lib/fineract/channel-charge-timing';
import { formatChargeAmountDisplay } from '@/lib/fineract/charge-display';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';
import type { SavingsAccountPaymentChannelCommand } from '@/lib/fineract/savings-account-command-meta';
import { savingsAccountChannelAllowed } from '@/lib/fineract/savings-payment-channels';

type PendingChannelCommand = {
  command: SavingsAccountPaymentChannelCommand;
  paymentTypeId: number;
  name: string;
};

function withChannelCommand(
  channels: SavingsAccountPaymentChannel[],
  command: PendingChannelCommand
): SavingsAccountPaymentChannel[] {
  return channels.map((channel) => {
    if (channel.paymentTypeId !== command.paymentTypeId) {
      return channel;
    }
    const subscribed =
      command.command === 'subscribe'
        ? true
        : command.command === 'unsubscribe'
          ? false
          : channel.subscribed;
    const blocked =
      command.command === 'block' ? true : command.command === 'unblock' ? false : channel.blocked;
    return {
      ...channel,
      subscribed,
      blocked,
      blockedOnDate: blocked ? channel.blockedOnDate : undefined,
      allowedForDeposit: savingsAccountChannelAllowed({
        isActive: channel.isActive,
        blocked,
        isPremium: channel.isPremium,
        subscribed
      })
    };
  });
}

/** Keep a just-confirmed subscription until the reloaded account reports the same status. */
function mergeServerChannels(
  local: SavingsAccountPaymentChannel[],
  server: SavingsAccountPaymentChannel[]
): SavingsAccountPaymentChannel[] {
  return server.map((channel) => {
    const previous = local.find((item) => item.paymentTypeId === channel.paymentTypeId);
    if (!previous) {
      return channel;
    }
    const subscribed =
      previous.subscribed === channel.subscribed ? channel.subscribed : previous.subscribed;
    const blocked = previous.blocked === channel.blocked ? channel.blocked : previous.blocked;
    if (subscribed === channel.subscribed && blocked === channel.blocked) {
      return channel;
    }
    return {
      ...channel,
      subscribed,
      blocked,
      blockedOnDate: blocked ? (channel.blockedOnDate ?? previous.blockedOnDate) : undefined,
      allowedForDeposit: savingsAccountChannelAllowed({
        isActive: channel.isActive,
        blocked,
        isPremium: channel.isPremium,
        subscribed
      })
    };
  });
}

function blockedSince(channel: SavingsAccountPaymentChannel): string | undefined {
  if (!channel.blocked || channel.blockedOnDate == null) {
    return undefined;
  }
  return formatFineractDateArray(channel.blockedOnDate, FINERACT_LOCALE) ?? undefined;
}

function commandCopy(command: PendingChannelCommand | null): { title: string; submit: string } {
  switch (command?.command) {
    case 'unsubscribe':
      return { title: `Unsubscribe from ${command.name}`, submit: 'Unsubscribe' };
    case 'block':
      return { title: `Block ${command.name} on this account`, submit: 'Block' };
    case 'unblock':
      return { title: `Unblock ${command.name} on this account`, submit: 'Unblock' };
    default:
      return { title: `Subscribe to ${command?.name ?? 'this channel'}`, submit: 'Subscribe' };
  }
}

function commandCompleted(command: SavingsAccountPaymentChannelCommand): string {
  switch (command) {
    case 'subscribe':
      return 'Subscribed to this channel.';
    case 'unsubscribe':
      return 'Unsubscribed from this channel.';
    case 'block':
      return 'Blocked this channel on this account.';
    case 'unblock':
      return 'Unblocked this channel on this account.';
  }
}

function channelFeeLabel(
  charge: SavingsAccountPaymentChannel['charges'][number],
  currencyCode: string
): string {
  const name = charge.name ?? `Fee ${charge.id}`;
  if (charge.useChargeTiers) {
    return `${name} · Tiered`;
  }
  const amount = formatChargeAmountDisplay(charge, currencyCode);
  return amount === '—' ? name : `${name} · ${amount}`;
}

function ChannelCommandDescription({
  command
}: {
  command?: SavingsAccountPaymentChannelCommand;
}) {
  if (command === 'unsubscribe') {
    return (
      <DialogDescription>
        Access to this premium channel ends now. Deposits and withdrawals on it stop. Fees already
        collected stay collected. A monthly or annual fee that is already due stays on the account
        until it is paid or waived. A fee that has not fallen due yet is dropped.
      </DialogDescription>
    );
  }
  if (command === 'block') {
    return (
      <DialogDescription>
        Deposits and withdrawals on this channel stop for this account. Other accounts are
        unchanged. This account&apos;s other channels are unchanged. A premium subscription stays
        active. This is not unsubscribe. A monthly or annual fee that is already due stays
        payable. Fees for the time the channel is blocked are not charged. Billing resumes on the
        next cycle after unblock.
      </DialogDescription>
    );
  }
  if (command === 'unblock') {
    return (
      <DialogDescription>
        The account block ends. Use resumes only if the product channel is still active and, for a
        premium channel, the subscription is still active. Scheduled fees resume on the next cycle
        on or after today.
      </DialogDescription>
    );
  }
  return (
    <DialogDescription>
      Subscribing allows deposits and withdrawals through this channel. Fees mapped to the channel
      are added to the account.
    </DialogDescription>
  );
}

export function SavingsAccountPaymentChannelsSection({
  clientId,
  accountId,
  currencyCode,
  accountActive,
  canManage,
  channels,
  loadError
}: {
  clientId: string;
  accountId: number;
  currencyCode: string;
  accountActive: boolean;
  canManage: boolean;
  channels: SavingsAccountPaymentChannel[];
  loadError?: string;
}) {
  const router = useRouter();
  const [listedChannels, setListedChannels] = useState(channels);
  const [listedAccountId, setListedAccountId] = useState(accountId);
  if (listedAccountId !== accountId) {
    setListedAccountId(accountId);
    setListedChannels(channels);
  }
  const [pendingCommand, setPendingCommand] = useState<PendingChannelCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setListedChannels((current) => mergeServerChannels(current, channels));
  }, [channels]);

  function handleConfirm() {
    if (!pendingCommand) {
      return;
    }
    setError(null);
    const command = pendingCommand;
    startTransition(async () => {
      const result = await executeSavingsAccountPaymentChannelAction(
        clientId,
        String(accountId),
        command.command,
        { paymentTypeId: command.paymentTypeId }
      );
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      if (!result.pendingChecker) {
        setListedChannels((current) =>
          withChannelCommand(result.channels ?? current, command)
        );
      }
      setPendingCommand(null);
      toastCommandOutcome(result, {
        completed: commandCompleted(command.command),
        pending:
          command.command === 'block' || command.command === 'unblock'
            ? 'Sent for approval. The block stays unchanged until it is approved.'
            : 'Sent for approval. The subscription stays unchanged until it is approved.'
      });
      router.refresh();
    });
  }

  const dialogCopy = commandCopy(pendingCommand);

  return (
    <DetailSection title="Payment channels">
      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : channels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This product does not limit payment channels. Every payment type can be used for deposits
          and withdrawals.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A channel can be used when it is enabled on the product and this account is not
            blocked. A premium channel also needs an active subscription. A disabled product
            channel stays listed.
          </p>
          {!accountActive ? (
            <p className="text-sm text-muted-foreground">
              Subscriptions can be changed once the account is active.
            </p>
          ) : null}
          <ul className="divide-y divide-border rounded-lg border border-border">
            {listedChannels.map((channel) => {
              const name = channel.paymentTypeName ?? `Payment type ${channel.paymentTypeId}`;
              const showSubscribe = channel.isPremium && channel.isActive && !channel.subscribed;
              const showUnsubscribe = channel.isPremium && channel.subscribed;
              const showBlock = !channel.blocked;
              const paused = !channel.isActive || channel.blocked;
              const since = blockedSince(channel);
              return (
                <li
                  key={channel.paymentTypeId}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{name}</span>
                      <Badge variant={channel.isPremium ? 'default' : 'secondary'}>
                        {channel.isPremium ? 'Premium' : 'Standard'}
                      </Badge>
                      {channel.isPremium ? (
                        <Badge variant={channel.subscribed ? 'default' : 'outline'}>
                          {channel.subscribed ? 'Subscribed' : 'Not subscribed'}
                        </Badge>
                      ) : null}
                    </div>
                    {!channel.isActive ? (
                      <p className="font-medium">Disabled on this product.</p>
                    ) : null}
                    {channel.blocked ? (
                      <p className="font-medium">
                        Blocked on this account{since ? ` since ${since}` : ''}.
                      </p>
                    ) : null}
                    <p className="text-muted-foreground">
                      Can be used: {formatYesNo(channel.allowedForDeposit)}
                    </p>
                    {channel.isPremium ? (
                      channel.charges.length === 0 ? (
                        <p className="text-muted-foreground">Fees: None</p>
                      ) : (
                        <ul className="space-y-1 text-muted-foreground">
                          {channel.charges.map((charge) => {
                            const timing = channelChargeTimingLabelFor(charge, { paused });
                            return (
                              <li key={charge.id}>
                                {channelFeeLabel(charge, currencyCode)}
                                {timing ? ` ${timing}` : ''}
                              </li>
                            );
                          })}
                        </ul>
                      )
                    ) : null}
                  </div>
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      {showSubscribe || showUnsubscribe ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={showUnsubscribe ? 'outline' : 'default'}
                          disabled={!accountActive || pending}
                          onClick={() =>
                            setPendingCommand({
                              command: showUnsubscribe ? 'unsubscribe' : 'subscribe',
                              paymentTypeId: channel.paymentTypeId,
                              name
                            })
                          }
                        >
                          {showUnsubscribe ? 'Unsubscribe' : 'Subscribe'}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          setPendingCommand({
                            command: showBlock ? 'block' : 'unblock',
                            paymentTypeId: channel.paymentTypeId,
                            name
                          })
                        }
                      >
                        {showBlock ? 'Block' : 'Unblock'}
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog
        open={pendingCommand != null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setPendingCommand(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogCopy.title}</DialogTitle>
            <ChannelCommandDescription command={pendingCommand?.command} />
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setPendingCommand(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingCommand?.command === 'unsubscribe' ? 'destructive' : 'default'}
              disabled={pending}
              onClick={handleConfirm}
            >
              {pending ? 'Saving…' : dialogCopy.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailSection>
  );
}
