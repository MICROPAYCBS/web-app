'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { InfoIcon } from 'lucide-react';
import { AppLink } from '@/components/routes/app-link';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger
} from '@/components/ui/popover';

export function MakerCheckerGuidance() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label="About maker-checker global configuration"
          />
        }
      >
        <InfoIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96" align="start" side="bottom">
        <PopoverHeader>
          <PopoverTitle>Requires global maker-checker setting</PopoverTitle>
          <PopoverDescription>
            Task toggles saved here only take effect when maker-checker is enabled under{' '}
            <AppLink
              href="/system/configurations"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Global configurations
            </AppLink>
            .
          </PopoverDescription>
        </PopoverHeader>
        <p className="text-sm text-muted-foreground">
          Enable the <span className="font-medium text-foreground">maker-checker</span> setting
          there before these tasks will require checker approval.
        </p>
      </PopoverContent>
    </Popover>
  );
}
