/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ClientActivationBlockerAction,
  CustomerClassActivationIssue
} from '@/lib/fineract/customer-class-eligibility';

export type ClientActivationBlocker = {
  message: string;
  hint?: string;
  action?: ClientActivationBlockerAction;
};

const FIELD_LABELS: Record<string, string> = {
  customerClassId: 'Customer class',
  activationDate: 'Activation date',
  dateOfBirth: 'Date of birth'
};

function humanizeRawFieldToken(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (FIELD_LABELS[trimmed]) {
    return FIELD_LABELS[trimmed];
  }
  if (/^[a-z][a-zA-Z0-9]*$/.test(trimmed)) {
    return trimmed
      .replace(/Id$/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }
  return undefined;
}

/** Never surface raw Fineract parameter names in the activate sheet. */
export function humanizeActivationBlockerMessage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Complete the missing customer requirements before activation.';
  }

  const label = humanizeRawFieldToken(trimmed);
  if (label && trimmed === raw.trim()) {
    return `Assign ${label.toLowerCase()} before activation.`;
  }

  return trimmed;
}

export function toClientActivationBlocker(
  issue: CustomerClassActivationIssue
): ClientActivationBlocker {
  if (issue.code === 'validation.msg.client.customerClassId.required') {
    return {
      message: 'Assign a customer class before you can activate this customer.',
      hint: 'Open Edit on the customer profile, choose Customer class, save your changes, then return here to activate.',
      action: 'edit-customer'
    };
  }

  if (issue.code === 'validation.msg.client.customerClassId.document.required') {
    return {
      message: issue.message,
      hint: 'Add at least one identity document on the Identities tab, then try activation again.',
      action: 'manage-identifiers'
    };
  }

  if (issue.code === 'validation.msg.client.customerClassId.signature.required') {
    return {
      message: issue.message,
      hint: 'Upload or draw a signature from Actions on the customer profile, then try activation again.'
    };
  }

  if (issue.code === 'validation.msg.client.customerClassId.photo.required') {
    return {
      message: issue.message,
      hint: 'Add a profile photo on the customer profile, then try activation again.'
    };
  }

  if (
    issue.code === 'validation.msg.client.customerClassId.edd.profile.required' ||
    issue.code === 'validation.msg.client.customerClassId.edd.pep.incomplete' ||
    issue.code === 'validation.msg.client.customerClassId.edd.fatca.required'
  ) {
    return {
      message: issue.message,
      hint: 'Complete the Compliance section on the customer profile, then try activation again.',
      action: 'compliance-profile'
    };
  }

  return {
    message: humanizeActivationBlockerMessage(issue.message),
    hint: issue.hint,
    action: issue.action
  };
}

export function activationBlockerActionLabel(
  action: ClientActivationBlockerAction
): string {
  switch (action) {
    case 'edit-customer':
      return 'Edit customer';
    case 'manage-identifiers':
      return 'Go to identities';
    case 'compliance-profile':
      return 'Go to compliance';
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function activationBlockerActionHref(
  clientId: string,
  action: ClientActivationBlockerAction
): string {
  switch (action) {
    case 'edit-customer':
      return `/clients/${clientId}/general?edit=1`;
    case 'manage-identifiers':
      return `/clients/${clientId}/identifiers`;
    case 'compliance-profile':
      return `/clients/${clientId}/compliance`;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
