import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  loanTransactionOffersUndo,
  loanTransactionUndoIsWriteOff
} from './loan-transaction-actions';

describe('loanTransactionOffersUndo', () => {
  it('allows a repayment that has not been reversed', () => {
    assert.equal(
      loanTransactionOffersUndo({ reversed: false, type: { id: 2, value: 'Repayment' } }),
      true
    );
  });

  it('hides undo on reversed, disbursement, and charge-off rows', () => {
    assert.equal(
      loanTransactionOffersUndo({ reversed: true, type: { id: 2, value: 'Repayment' } }),
      false
    );
    assert.equal(
      loanTransactionOffersUndo({ reversed: false, type: { id: 1, value: 'Disbursement' } }),
      false
    );
    assert.equal(
      loanTransactionOffersUndo({ reversed: false, type: { id: 27, value: 'Charge-off' } }),
      false
    );
  });

  it('treats write-off as its own undo', () => {
    assert.equal(loanTransactionUndoIsWriteOff({ type: { id: 6, value: 'Write-off' } }), true);
    assert.equal(
      loanTransactionOffersUndo({ reversed: false, type: { id: 6, value: 'Write-off' } }),
      true
    );
  });
});
