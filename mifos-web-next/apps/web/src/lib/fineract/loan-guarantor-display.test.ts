/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LoanGuarantorRecord } from '@/lib/fineract/loan-account-types';
import {
  loanGuaranteeShortfall,
  loanGuarantorCanRemovePerson,
  loanGuarantorDisplayName,
  loanGuarantorOwnSavingsIssue,
  loanHasRecoverableGuarantee
} from '@/lib/fineract/loan-guarantor-display';

function guarantor(overrides: Partial<LoanGuarantorRecord> = {}): LoanGuarantorRecord {
  return {
    id: 1,
    active: true,
    guarantorTypeId: 1,
    entityId: 42,
    funding: [],
    ...overrides
  };
}

describe('loan guarantor display', () => {
  it('labels a group from the loaded group name', () => {
    assert.equal(
      loanGuarantorDisplayName({ guarantorTypeId: 4, groupName: 'Kisasi traders' }),
      'Kisasi traders'
    );
  });

  it('blocks the borrower from guaranteeing without savings', () => {
    assert.match(
      loanGuarantorOwnSavingsIssue({
        guarantorTypeId: 1,
        entityId: 15,
        borrowerClientId: 15,
        holdGuaranteeFunds: true
      }) ?? '',
      /own savings/
    );
  });

  it('requires an empty relationship for the borrower own-savings pledge', () => {
    assert.match(
      loanGuarantorOwnSavingsIssue({
        guarantorTypeId: 1,
        entityId: 15,
        borrowerClientId: 15,
        savingsId: 88,
        clientRelationshipTypeId: 3,
        holdGuaranteeFunds: true
      }) ?? '',
      /relationship/i
    );
  });

  it('allows the borrower to pledge savings with no relationship', () => {
    assert.equal(
      loanGuarantorOwnSavingsIssue({
        guarantorTypeId: 1,
        entityId: 15,
        borrowerClientId: 15,
        savingsId: 88,
        holdGuaranteeFunds: true
      }),
      null
    );
  });

  it('removes a person only when they have no funding lines', () => {
    assert.equal(loanGuarantorCanRemovePerson(guarantor()), true);
    assert.equal(
      loanGuarantorCanRemovePerson(
        guarantor({ funding: [{ id: 3, statusId: 100, amount: 5000 }] })
      ),
      false
    );
  });

  it('reports the guarantee shortfall from active pledges', () => {
    const shortfall = loanGuaranteeShortfall({
      principal: 10_000,
      thresholds: {
        holdGuaranteeFunds: true,
        mandatoryGuarantee: 20,
        minimumGuaranteeFromOwnFunds: 10,
        minimumGuaranteeFromGuarantor: 10
      },
      borrowerClientId: 15,
      guarantors: [
        guarantor({
          entityId: 15,
          funding: [{ id: 1, statusId: 100, amount: 500 }]
        })
      ]
    });
    assert.equal(shortfall?.ownFundsRequired, 1000);
    assert.equal(shortfall?.ownFundsPledged, 500);
    assert.equal(shortfall?.ownFundsShort, 500);
    assert.equal(shortfall?.otherShort, 1000);
    assert.equal(shortfall?.mandatoryShort, 1500);
  });

  it('detects an active remaining pledge that can be recovered', () => {
    assert.equal(
      loanHasRecoverableGuarantee([
        guarantor({ funding: [{ id: 1, statusId: 100, amountRemaining: 500 }] })
      ]),
      true
    );
    assert.equal(
      loanHasRecoverableGuarantee([
        guarantor({ funding: [{ id: 1, statusId: 200, amountRemaining: 0 }] })
      ]),
      false
    );
  });
});
