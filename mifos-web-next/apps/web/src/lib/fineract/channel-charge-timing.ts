/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEnumOption,
  FineractSavingsAccountCharge,
  SavingsAccountPaymentChannel,
  SavingsProductPaymentChannelCharge
} from '@mifos/api-client';

const WITHDRAWAL = 5;
const ANNUAL = 6;
const MONTHLY = 7;
const OVERDRAFT = 10;

export function chargeTimeId(option?: FineractEnumOption): number | undefined {
  if (option?.id != null && Number.isFinite(option.id)) {
    return option.id;
  }
  const text = `${option?.code ?? ''} ${option?.value ?? ''} ${option?.name ?? ''}`.toLowerCase();
  if (text.includes('withdraw')) {
    return WITHDRAWAL;
  }
  if (text.includes('annual')) {
    return ANNUAL;
  }
  if (text.includes('monthly')) {
    return MONTHLY;
  }
  if (text.includes('overdraft')) {
    return OVERDRAFT;
  }
  return undefined;
}

export const CHANNEL_FEE_PAUSED_LABEL =
  'Paused while this channel cannot be used. An amount already due stays payable.';

/** Shown on the product when the catalog row is turned off for every account. */
export const PRODUCT_CHANNEL_DISABLED_LINES = [
  'No account on this product can deposit or withdraw on this channel.',
  'Existing subscriptions stay in place.',
  'Monthly and annual fees pause. An amount already due stays payable. Missed cycles are not billed later.',
  'Turning it back on does not clear a block on an individual account.'
] as const;

/** When a mapped channel fee is charged. Omitted for times that are not withdrawal, overdraft, monthly, or annual. */
export function channelChargeTimingLabel(timeId?: number): string | undefined {
  if (timeId === WITHDRAWAL || timeId === OVERDRAFT) {
    return 'Charged only when this channel is used.';
  }
  if (timeId === MONTHLY || timeId === ANNUAL) {
    return 'Charged on its schedule while subscribed.';
  }
  return undefined;
}

export function isScheduledChannelFee(timeId?: number): boolean {
  return timeId === MONTHLY || timeId === ANNUAL;
}

export function isWithdrawalFee(timeId?: number): boolean {
  return timeId === WITHDRAWAL;
}

function chargeDefinitionId(charge: FineractSavingsAccountCharge): number | undefined {
  return charge.chargeId;
}

/**
 * Withdrawal fees to show for one payment type.
 * A fee mapped on a channel applies only for that channel. Any other withdrawal fee applies for every payment type.
 */
export function withdrawalFeesForPaymentType(
  charges: FineractSavingsAccountCharge[],
  channels: SavingsAccountPaymentChannel[],
  paymentTypeId: number
): FineractSavingsAccountCharge[] {
  const channelFeeIds = new Map<number, Set<number>>();
  for (const channel of channels) {
    for (const mapped of channel.charges) {
      const timeId = chargeTimeId(mapped.chargeTimeType);
      if (timeId != null && !isWithdrawalFee(timeId)) {
        continue;
      }
      const paymentTypes = channelFeeIds.get(mapped.id) ?? new Set<number>();
      paymentTypes.add(channel.paymentTypeId);
      channelFeeIds.set(mapped.id, paymentTypes);
    }
  }

  return charges.filter((charge) => {
    if (!isWithdrawalFee(chargeTimeId(charge.chargeTimeType)) || charge.isActive === false) {
      return false;
    }
    const definitionId = chargeDefinitionId(charge);
    const paymentTypes = definitionId != null ? channelFeeIds.get(definitionId) : undefined;
    if (!paymentTypes) {
      return true;
    }
    return paymentTypes.has(paymentTypeId);
  });
}

function unsubscribedChannelChargeIds(channels: SavingsAccountPaymentChannel[]): Set<number> {
  const byCharge = new Map<number, { subscribed: boolean }>();
  for (const channel of channels) {
    if (!channel.isPremium) {
      continue;
    }
    for (const mapped of channel.charges) {
      const current = byCharge.get(mapped.id) ?? { subscribed: false };
      if (channel.subscribed) {
        current.subscribed = true;
      }
      byCharge.set(mapped.id, current);
    }
  }
  const ids = new Set<number>();
  for (const [id, flags] of byCharge) {
    if (!flags.subscribed) {
      ids.add(id);
    }
  }
  return ids;
}

export function savingsChargeOutstanding(charge: FineractSavingsAccountCharge): number {
  const amount = charge.amountOutstanding ?? 0;
  return Number.isFinite(amount) ? amount : 0;
}

export function savingsChargeActions(
  charge: FineractSavingsAccountCharge,
  channels: SavingsAccountPaymentChannel[] = []
): { label: string; canPay: boolean; canWaive: boolean } {
  if (charge.isWaived) {
    return { label: 'Waived', canPay: false, canWaive: false };
  }
  const outstanding = savingsChargeOutstanding(charge);
  if (charge.isActive === false) {
    if (outstanding > 0) {
      return { label: 'Stopped, amount still due', canPay: true, canWaive: false };
    }
    return { label: 'Stopped', canPay: false, canWaive: false };
  }
  if (charge.isPaid && outstanding <= 0) {
    return { label: 'Paid', canPay: false, canWaive: false };
  }
  const definitionId = charge.chargeId;
  if (
    outstanding > 0 &&
    isScheduledChannelFee(chargeTimeId(charge.chargeTimeType)) &&
    definitionId != null &&
    unsubscribedChannelChargeIds(channels).has(definitionId)
  ) {
    return { label: 'Subscribed period still due', canPay: true, canWaive: true };
  }
  if (outstanding > 0) {
    return { label: 'Outstanding', canPay: true, canWaive: true };
  }
  return { label: 'Active', canPay: false, canWaive: false };
}

export function channelChargeTimingLabelFor(
  charge: Pick<SavingsProductPaymentChannelCharge, 'chargeTimeType'>,
  options?: { paused?: boolean }
): string | undefined {
  const timeId = chargeTimeId(charge.chargeTimeType);
  if (options?.paused && isScheduledChannelFee(timeId)) {
    return CHANNEL_FEE_PAUSED_LABEL;
  }
  return channelChargeTimingLabel(timeId);
}
