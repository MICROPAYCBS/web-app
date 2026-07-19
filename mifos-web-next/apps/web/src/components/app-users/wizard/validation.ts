/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  validateCreateUser,
  validateUpdateUser,
  type CreateUserInput,
  type UpdateUserInput
} from '@mifos/validation';
import { canSendPasswordToEmail, isValidEmail } from './email';
import type { StepErrors, UserWizardDraft, UserWizardMode } from './types';

const personNamePattern = /^[A-Za-z].*/;
const passwordPattern =
  /^(?!.*(.)\1)(?!.*\s)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\s]).{12,50}$/;

function zodIssuesToErrors(
  issues: { path: (string | number)[]; message: string }[],
  fields?: readonly string[]
): StepErrors {
  const errors: StepErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    if (!key || (fields && !fields.includes(key))) {
      continue;
    }
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

function validateAccountStep(mode: UserWizardMode, draft: UserWizardDraft): StepErrors {
  const errors: StepErrors = {};

  if (!draft.username.trim()) {
    errors.username = 'Login name is required.';
  }
  if (!draft.firstname.trim()) {
    errors.firstname = 'First name is required.';
  } else if (!personNamePattern.test(draft.firstname.trim())) {
    errors.firstname = 'First name must start with a letter.';
  }
  if (!draft.lastname.trim()) {
    errors.lastname = 'Last name is required.';
  } else if (!personNamePattern.test(draft.lastname.trim())) {
    errors.lastname = 'Last name must start with a letter.';
  }

  const email = draft.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

function validateAccessStep(draft: UserWizardDraft): StepErrors {
  const errors: StepErrors = {};
  const officeId = Number(draft.officeId);
  if (!draft.officeId || !Number.isFinite(officeId) || officeId <= 0) {
    errors.officeId = 'Branch is required.';
  }
  if (!draft.roles.length) {
    errors.roles = 'Select at least one role.';
  }
  return errors;
}

function validatePasswordStep(draft: UserWizardDraft): StepErrors {
  const errors: StepErrors = {};

  if (canSendPasswordToEmail(draft)) {
    return errors;
  }

  if (draft.sendPasswordToEmail && !isValidEmail(draft.email)) {
    errors.email = 'Enter a valid email address on the Account step to send the password by email.';
    return errors;
  }

  if (!draft.password.trim()) {
    errors.password = 'Password is required.';
  } else if (!passwordPattern.test(draft.password)) {
    errors.password =
      'Password must be 12 to 50 characters and include uppercase, lowercase, number, and special character.';
  }

  if (!draft.repeatPassword.trim()) {
    errors.repeatPassword = 'Confirm password is required.';
  } else if (draft.password !== draft.repeatPassword) {
    errors.repeatPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateUserStep(
  stepId: string,
  mode: UserWizardMode,
  draft: UserWizardDraft
): StepErrors {
  if (stepId === 'review') {
    return {};
  }
  if (stepId === 'account') {
    return validateAccountStep(mode, draft);
  }
  if (stepId === 'access') {
    return validateAccessStep(draft);
  }
  if (stepId === 'password' && mode === 'create') {
    return validatePasswordStep(draft);
  }
  return {};
}

export function validateUserDraft(mode: UserWizardMode, draft: UserWizardDraft): StepErrors {
  const parsed =
    mode === 'create'
      ? validateCreateUser(draftToCreatePayload(draft))
      : validateUpdateUser(draftToUpdatePayload(draft));

  if (parsed.success) {
    return {};
  }

  return zodIssuesToErrors(parsed.error.issues);
}

export function draftToCreatePayload(draft: UserWizardDraft): CreateUserInput {
  return {
    username: draft.username.trim(),
    firstname: draft.firstname.trim(),
    lastname: draft.lastname.trim(),
    email: draft.email.trim(),
    officeId: Number(draft.officeId),
    staffId: draft.staffId ? Number(draft.staffId) : undefined,
    roles: draft.roles,
    sendPasswordToEmail: canSendPasswordToEmail(draft),
    passwordNeverExpires: draft.passwordNeverExpires,
    isLoginRetriesEnabled: draft.isLoginRetriesEnabled,
    password: draft.password,
    repeatPassword: draft.repeatPassword
  };
}

export function draftToUpdatePayload(draft: UserWizardDraft): UpdateUserInput {
  return {
    username: draft.username.trim(),
    firstname: draft.firstname.trim(),
    lastname: draft.lastname.trim(),
    email: draft.email.trim(),
    officeId: Number(draft.officeId),
    staffId: draft.staffId ? Number(draft.staffId) : null,
    roles: draft.roles,
    passwordNeverExpires: draft.passwordNeverExpires,
    isLoginRetriesEnabled: draft.isLoginRetriesEnabled,
    isPasswordResetAllowed: draft.isPasswordResetAllowed
  };
}

export function draftToPayload(
  mode: UserWizardMode,
  draft: UserWizardDraft
): CreateUserInput | UpdateUserInput {
  return mode === 'create' ? draftToCreatePayload(draft) : draftToUpdatePayload(draft);
}
