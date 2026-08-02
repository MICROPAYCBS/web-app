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
import {
  buildClientsImportTemplateWorkbook,
  buildClientsLegacyImportTemplateWorkbook
} from '@/lib/clients/clients-import-workbook';
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
    const officeIdParam = searchParams.get('officeId');
    const officeIdFromQuery =
      officeIdParam && Number.isInteger(Number(officeIdParam)) && Number(officeIdParam) > 0
        ? Number(officeIdParam)
        : undefined;
    if (legacy && officeIdFromQuery == null) {
      return Response.json(
        { message: 'Select a branch before downloading the legacy template.' },
        { status: 400 }
      );
    }
    const defaultOfficeId =
      officeIdFromQuery ?? (session.officeId > 0 ? session.officeId : undefined);
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
    const buffer = legacy
      ? buildClientsLegacyImportTemplateWorkbook(lookups)
      : buildClientsImportTemplateWorkbook(lookups);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': legacy
          ? 'attachment; filename="customers-legacy-import-template.xlsx"'
          : 'attachment; filename="customers-import-template.xlsx"'
      }
    });
  } catch (err) {
    return jsonError(err);
  }
}
