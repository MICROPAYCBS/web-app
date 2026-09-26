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
import { formatChargeAmountDisplay } from '@/lib/fineract/charge-display';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';

type PendingChannelCommand = {
  command: 'subscribe' | 'unsubscribe';
  paymentTypeId: number;
  name: string;
};

function withChannelCommand(
  channels: SavingsAccountPaymentChannel[],
  command: PendingChannelCommand
): SavingsAccountPaymentChannel[] {
  const subscribed = command.command === 'subscribe';
  return channels.map((channel) => {
    if (channel.paymentTypeId !== command.paymentTypeId) {
      return channel;
    }
    return {
      ...channel,
      subscribed,
      allowedForDeposit: channel.isActive && (!channel.isPremium || subscribed)
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
    if (!previous || previous.subscribed === channel.subscribed) {
      return channel;
    }
    return {
      ...channel,
      subscribed: previous.subscribed,
      allowedForDeposit: previous.allowedForDeposit
    };
  });
}

function channelFees(channel: SavingsAccountPaymentChannel, currencyCode: string): string {
  if (channel.charges.length === 0) {
    return 'None';
  }
  return channel.charges
    .map((charge) => {
      const name = charge.name ?? `Fee ${charge.id}`;
      if (charge.useChargeTiers) {
        return `${name} · Tiered`;
      }
      const amount = formatChargeAmountDisplay(charge, currencyCode);
      return amount === '—' ? name : `${name} · ${amount}`;
    })
    .join(', ');
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
        completed:
          command.command === 'subscribe'
            ? 'Subscribed to this channel.'
            : 'Unsubscribed from this channel.',
        pending: 'Sent for approval. The subscription stays unchanged until it is approved.'
      });
      router.refresh();
    });
  }

  const subscribeCopy =
    pendingCommand?.command === 'unsubscribe'
      ? {
          title: `Unsubscribe from ${pendingCommand.name}`,
          description:
            'This channel will no longer be available for deposits and withdrawals. Recurring fees linked to the subscription are stopped. Fees already charged stay on the account.',
          submit: 'Unsubscribe'
        }
      : {
          title: `Subscribe to ${pendingCommand?.name ?? 'this channel'}`,
          description:
            'Subscribing allows deposits and withdrawals through this channel. Fees mapped to the channel are added to the account.',
          submit: 'Subscribe'
        };

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
            Standard channels are always allowed. Premium channels can be used after this account
            subscribes.
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
                      {!channel.isActive ? <Badge variant="outline">Inactive</Badge> : null}
                      {channel.isPremium ? (
                        <Badge variant={channel.subscribed ? 'default' : 'outline'}>
                          {channel.subscribed ? 'Subscribed' : 'Not subscribed'}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground">
                      Allowed for deposit: {formatYesNo(channel.allowedForDeposit)}
                      {channel.isPremium ? ` · Fees: ${channelFees(channel, currencyCode)}` : ''}
                    </p>
                  </div>
                  {canManage && (showSubscribe || showUnsubscribe) ? (
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
            <DialogTitle>{subscribeCopy.title}</DialogTitle>
            <DialogDescription>{subscribeCopy.description}</DialogDescription>
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
              {pending ? 'Saving…' : subscribeCopy.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailSection>
  );
}
