/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createClientDisplayNameFromCommandAsJson,
  createClientDraftFromCommandAsJson,
  createClientDraftFromCommandPayload,
  isCreateClientCheckerCommand,
  parseCreateClientCommandAsJson
} from './create-client-command-review';

const SAMPLE_PAYLOAD = {
  officeId: 1,
  staffId: 12,
  legalFormId: 1,
  externalId: 'EXT-100',
  firstname: 'Ada',
  middlename: 'Lovelace',
  lastname: 'Byron',
  genderId: 2,
  mobileNo: '0700123456',
  emailAddress: 'ada@example.com',
  submittedOnDate: '11 July 2026',
  dateFormat: 'dd MMMM yyyy',
  locale: 'en',
  clientIdentifiers: [{ documentTypeId: 5, documentKey: 'NIN-123' }],
  familyMembers: [
    { firstName: 'Ann', lastName: 'Byron', relationshipId: 3, genderId: 2, mobileNumber: '0700999' }
  ],
  incomeSources: [
    {
      incomeSourceTypeId: 1,
      employerName: 'Analytical Engines',
      isPrimary: true
    }
  ],
  contacts: [{ contactTypeId: 9, contactValue: '0700111', primary: true }],
  complianceProfile: {
    hasOtherBankAccounts: true,
    isPep: false,
    usCitizenOrResident: false,
    fatcaRegistered: false,
    otherBankAccounts: [{ bankName: 'Stanbic', accountNumber: '123', branch: 'Kampala' }]
  },
  address: [{ street: '1 Parliament Ave', city: 'Kampala', isPrimary: true }],
  datatables: [{ registeredTableName: 'client_extra', data: { niche: 'science' } }]
};

describe('create-client-command-review', () => {
  it('detects CREATE CLIENT commands', () => {
    assert.equal(isCreateClientCheckerCommand('CREATE', 'CLIENT'), true);
    assert.equal(isCreateClientCheckerCommand('create', 'client'), true);
    assert.equal(isCreateClientCheckerCommand('UPDATE', 'CLIENT'), false);
    assert.equal(isCreateClientCheckerCommand('CREATE', 'LOAN'), false);
  });

  it('parses command JSON', () => {
    const parsed = parseCreateClientCommandAsJson(JSON.stringify(SAMPLE_PAYLOAD));
    assert.ok(parsed);
    assert.equal(parsed?.officeId, 1);
    assert.equal(parseCreateClientCommandAsJson('{'), null);
    assert.equal(parseCreateClientCommandAsJson(undefined), null);
  });

  it('maps payload into create-client draft sections', () => {
    const draft = createClientDraftFromCommandPayload(SAMPLE_PAYLOAD);
    assert.equal(draft.general.firstname, 'Ada');
    assert.equal(draft.general.lastname, 'Byron');
    assert.equal(draft.general.officeId, 1);
    assert.equal(draft.general.mobileNo, '0700123456');
    assert.equal(draft.clientIdentifiers.length, 1);
    assert.equal(draft.clientIdentifiers[0]?.documentKey, 'NIN-123');
    assert.equal(draft.familyMembers[0]?.firstName, 'Ann');
    assert.equal(draft.incomeSources[0]?.employerBusinessName, 'Analytical Engines');
    assert.equal(draft.incomeSources[0]?.isPrimarySource, true);
    assert.equal(draft.contacts[0]?.contactValue, '0700111');
    assert.equal(draft.addresses[0]?.city, 'Kampala');
    assert.equal(draft.complianceProfile.hasOtherBankAccounts, true);
    assert.equal(draft.complianceProfile.otherBankAccounts?.[0]?.bankName, 'Stanbic');
    assert.equal(draft.complianceProfile.otherBankAccounts?.[0]?.branchName, 'Kampala');
    assert.deepEqual(draft.datatables.client_extra, { niche: 'science' });
  });

  it('maps from commandAsJson string', () => {
    const draft = createClientDraftFromCommandAsJson(JSON.stringify(SAMPLE_PAYLOAD));
    assert.ok(draft);
    assert.equal(draft?.general.fullname, undefined);
    assert.equal(draft?.general.firstname, 'Ada');
  });

  it('builds a display name from command JSON', () => {
    assert.equal(
      createClientDisplayNameFromCommandAsJson(JSON.stringify(SAMPLE_PAYLOAD)),
      'Ada Byron'
    );
    assert.equal(
      createClientDisplayNameFromCommandAsJson(JSON.stringify({ fullname: 'Acme Ltd' })),
      'Acme Ltd'
    );
    assert.equal(createClientDisplayNameFromCommandAsJson(undefined), undefined);
  });
});
