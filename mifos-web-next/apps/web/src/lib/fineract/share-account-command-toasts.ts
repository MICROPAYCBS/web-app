/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CommandOutcomeToastMessages } from '@/lib/command-outcome-toast';

export const SHARE_ACCOUNT_CREATE_TOAST: CommandOutcomeToastMessages = {
  completed: 'Share account application submitted.',
  pending: 'Share account application sent for approval.'
};

export const SHARE_ACCOUNT_UPDATE_TOAST: CommandOutcomeToastMessages = {
  completed: 'Share account application updated.',
  pending: 'Update sent for checker review.'
};

export const SHARE_LIFECYCLE_COMMAND_TOAST = {
  approve: {
    completed: 'Share account approved.',
    pending: 'Approval sent for checker review.'
  },
  activate: {
    completed: 'Share account activated.',
    pending: 'Activation sent for checker review.'
  },
  reject: {
    completed: 'Share account rejected.',
    pending: 'Rejection sent for checker review.'
  },
  undoApproval: {
    completed: 'Approval undone.',
    pending: 'Undo approval sent for checker review.'
  },
  close: {
    completed: 'Share account closed.',
    pending: 'Close sent for checker review.'
  }
} satisfies Record<string, CommandOutcomeToastMessages>;

export const SHARE_OPS_COMMAND_TOAST = {
  applyAdditional: {
    completed: 'Additional shares requested.',
    pending: 'Request sent for checker review.'
  },
  approveAdditional: {
    completed: 'Additional shares approved.',
    pending: 'Approval sent for checker review.'
  },
  rejectAdditional: {
    completed: 'Additional shares rejected.',
    pending: 'Rejection sent for checker review.'
  },
  redeem: {
    completed: 'Shares redeemed.',
    pending: 'Redemption sent for checker review.'
  }
} satisfies Record<string, CommandOutcomeToastMessages>;
