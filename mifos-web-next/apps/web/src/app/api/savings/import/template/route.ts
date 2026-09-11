/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { loadSavingsTransactionsImportPaymentTypes } from '@/lib/savings/savings-transactions-import-lookups';
import { jsonError } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { buildSavingsTransactionsImportTemplateWorkbook } from '@/lib/savings/savings-transactions-import-workbook';

export async function GET() {
  const { session, error } = await requireRoutePermission('/savings/import');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('savings.importTransactions'));
  } catch {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const paymentTypes = await loadSavingsTransactionsImportPaymentTypes();
    const buffer = buildSavingsTransactionsImportTemplateWorkbook(paymentTypes);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="savings-transactions-import-template.xlsx"'
      }
    });
  } catch (err) {
    return jsonError(err);
  }
}
