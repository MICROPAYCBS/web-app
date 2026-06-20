/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserDetail } from '@mifos/api-client';
import type { UserWizardDraft } from './types';

export function defaultUserWizardDraft(): UserWizardDraft {
  return {
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    sendPasswordToEmail: false,
    passwordNeverExpires: false,
    isLoginRetriesEnabled: false,
    isPasswordResetAllowed: false,
    password: '',
    repeatPassword: '',
    officeId: '',
    staffId: '',
    roles: []
  };
}

export function userWizardDraftFromUser(user: FineractUserDetail): UserWizardDraft {
  return {
    username: user.username,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    sendPasswordToEmail: false,
    passwordNeverExpires: user.passwordNeverExpires,
    isLoginRetriesEnabled: user.isLoginRetriesEnabled,
    isPasswordResetAllowed: user.isPasswordResetAllowed,
    password: '',
    repeatPassword: '',
    officeId: String(user.officeId),
    staffId: user.staff?.id ? String(user.staff.id) : '',
    roles: user.selectedRoles.map((role) => role.id)
  };
}
