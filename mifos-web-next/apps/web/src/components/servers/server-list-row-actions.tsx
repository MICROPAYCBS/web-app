'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CheckIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { ServerRowIconButton } from '@/components/servers/server-row-icon-button';

export function ServerListRowActions({
  isActive,
  pending,
  onUse,
  onEdit,
  onRemove
}: {
  isActive: boolean;
  pending?: boolean;
  onUse: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {!isActive ? (
        <ServerRowIconButton
          label="Use this server"
          variant="secondary"
          disabled={pending}
          onClick={onUse}
        >
          <CheckIcon className="size-4" />
        </ServerRowIconButton>
      ) : null}
      <ServerRowIconButton label="Edit server" variant="outline" onClick={onEdit}>
        <PencilIcon className="size-4" />
      </ServerRowIconButton>
      <ServerRowIconButton
        label="Remove server"
        variant="destructive"
        disabled={pending}
        onClick={onRemove}
      >
        <Trash2Icon className="size-4" />
      </ServerRowIconButton>
    </div>
  );
}
