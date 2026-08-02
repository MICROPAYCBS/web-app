/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { FineractClientIdentifierTemplate } from '@mifos/api-client';
import { jsonError } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { buildClientsImportLookups } from '@/lib/clients/clients-import-lookups';
import { buildClientsImportTemplateWorkbook } from '@/lib/clients/clients-import-workbook';
import { CLIENTS_LEGACY_BULK_IMPORT_NAME } from '@/lib/clients/clients-import-legacy';
import { getBulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { fetchBulkImportTemplate } from '@/lib/fineract/bulk-import';
import { getClientIdentifierTemplate } from '@/lib/fineract/client-identifiers';
import { getClientTemplate } from '@/lib/fineract/clients';
import { listCustomerClasses } from '@/lib/fineract/customer-classes';
import { listStaff } from '@/lib/fineract/staff';

export async function GET(request: Request) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const legacy = searchParams.get('mode') === 'legacy';

    if (legacy) {
      const officeId = searchParams.get('officeId') ?? undefined;
      const staffId = searchParams.get('staffId') ?? undefined;
      const legalFormType = searchParams.get('legalFormType') ?? undefined;
      if (!officeId) {
        return Response.json(
          { message: 'Select a branch before downloading the legacy template.' },
          { status: 400 }
        );
      }
      if (!legalFormType) {
        return Response.json(
          { message: 'Select a profile type before downloading the legacy template.' },
          { status: 400 }
        );
      }

      const definition = getBulkImportDefinition(CLIENTS_LEGACY_BULK_IMPORT_NAME);
      if (!definition) {
        return Response.json({ message: 'Customers bulk import is not configured.' }, { status: 404 });
      }

      const res = await fetchBulkImportTemplate(definition, {
        officeId,
        staffId,
        legalFormType
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
            res.headers.get('content-disposition') ??
            'attachment; filename="clients-legacy-import-template.xls"'
        }
      });
    }

    const defaultOfficeId = session.officeId > 0 ? session.officeId : undefined;
    const [template, staff, identifierTemplate, customerClasses] = await Promise.all([
      getClientTemplate(defaultOfficeId),
      listStaff().catch(() => []),
      getClientIdentifierTemplate(1).catch(
        (): FineractClientIdentifierTemplate => ({
          allowedDocumentTypes: [],
          identityTypeOptions: []
        })
      ),
      listCustomerClasses().catch(() => [])
    ]);

    if (!template.customerClassOptions?.length && customerClasses.length > 0) {
      template.customerClassOptions = customerClasses;
    }

    const lookups = buildClientsImportLookups({ template, staff, identifierTemplate });
    const buffer = buildClientsImportTemplateWorkbook(lookups);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="customers-import-template.xlsx"'
      }
    });
  } catch (err) {
    return jsonError(err);
  }
}
