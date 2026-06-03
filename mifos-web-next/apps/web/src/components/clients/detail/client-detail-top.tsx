/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { ChevronLeft, Hash, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ClientProfileAvatar } from '@/components/clients/detail/client-profile-avatar';
import { DetailHeader, EmptyValue } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { clientDisplayName } from '@/lib/fineract/clients-display';

function ClientHeaderKeyInfo({
  mobileNo,
  emailAddress,
  externalId
}: {
  mobileNo?: string;
  emailAddress?: string;
  externalId?: string;
}) {
  const mobile = mobileNo?.trim();
  const email = emailAddress?.trim();
  const external = externalId?.trim();
  const linkClassName =
    'inline-flex min-w-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground';
  const missingClassName = 'inline-flex min-w-0 items-center gap-1.5 text-muted-foreground';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {mobile ? (
        <a href={`tel:${mobile}`} className={linkClassName} aria-label={`Mobile ${mobile}`}>
          <Phone className="size-4 shrink-0" aria-hidden />
          <span>{mobile}</span>
        </a>
      ) : (
        <span className={missingClassName} aria-label="Mobile not provided">
          <Phone className="size-4 shrink-0" aria-hidden />
          <EmptyValue />
        </span>
      )}
      {email ? (
        <a href={`mailto:${email}`} className={linkClassName} aria-label={`Email ${email}`}>
          <Mail className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{email}</span>
        </a>
      ) : (
        <span className={missingClassName} aria-label="Email not provided">
          <Mail className="size-4 shrink-0" aria-hidden />
          <EmptyValue />
        </span>
      )}
      {external ? (
        <span className={missingClassName} aria-label={`External ID ${external}`}>
          <Hash className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{external}</span>
        </span>
      ) : (
        <span className={missingClassName} aria-label="External ID not provided">
          <Hash className="size-4 shrink-0" aria-hidden />
          <EmptyValue />
        </span>
      )}
    </div>
  );
}

export function ClientDetailTop({
  client,
  initialImageSrc,
  canCreateImage,
  canDeleteImage,
  summary
}: {
  client: FineractClientDetail;
  initialImageSrc: string | null;
  canCreateImage: boolean;
  canDeleteImage: boolean;
  summary?: ReactNode;
}) {
  const name = clientDisplayName(client);

  return (
    <div className="space-y-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to clients
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ClientProfileAvatar
          client={client}
          initialImageSrc={initialImageSrc}
          canCreateImage={canCreateImage}
          canDeleteImage={canDeleteImage}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <DetailHeader
            title={name}
            status={{
              label: client.status?.value ?? 'Unknown',
              variant: 'secondary'
            }}
            meta={
              <div className="space-y-2">
                <span>
                  Account {client.accountNo}
                  {client.officeName ? ` · ${client.officeName}` : ''}
                  {client.staffName ? ` · ${client.staffName}` : ''}
                </span>
                <ClientHeaderKeyInfo
                  mobileNo={client.mobileNo}
                  emailAddress={client.emailAddress}
                  externalId={client.externalId}
                />
              </div>
            }
            actions={
              <Button type="button" variant="outline" disabled>
                Actions
              </Button>
            }
          />

          {summary ?? null}
        </div>
      </div>
    </div>
  );
}
