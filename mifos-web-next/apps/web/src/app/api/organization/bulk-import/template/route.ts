/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { jsonError } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import { getBulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { fetchBulkImportTemplate } from '@/lib/fineract/bulk-import';

export async function GET(request: Request) {
  const { session, error } = await requireServerSession();
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('organization.bulkImport'));
  } catch {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const importName = searchParams.get('importName');
  if (!importName) {
    return Response.json({ message: 'importName is required' }, { status: 400 });
  }

  const definition = getBulkImportDefinition(importName);
  if (!definition) {
    return Response.json({ message: 'Unknown bulk import type' }, { status: 404 });
  }

  try {
    assertCan(session, definition.downloadPermission);
  } catch {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const res = await fetchBulkImportTemplate(definition, {
      officeId: searchParams.get('officeId') ?? undefined,
      staffId: searchParams.get('staffId') ?? undefined,
      legalFormType: searchParams.get('legalFormType') ?? undefined
    });

    if (!res.ok) {
      return Response.json({ message: 'Template not found' }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? 'application/vnd.ms-excel';
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition':
          res.headers.get('content-disposition') ?? 'attachment; filename="template.xls"'
      }
    });
  } catch (err) {
    return jsonError(err);
  }
}
